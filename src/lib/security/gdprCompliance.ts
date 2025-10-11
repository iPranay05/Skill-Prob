import { EncryptionService } from './encryption';
import { database } from '../database';

export interface DataExportRequest {
  userId: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface DataDeletionRequest {
  userId: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletionDate?: Date;
  retentionReason?: string;
}

export interface ConsentRecord {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'functional' | 'necessary';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
}

export class GDPRComplianceService {
  // Data export functionality
  static async requestDataExport(userId: string): Promise<string> {
    try {
      // Create export request record
      const exportRequest: DataExportRequest = {
        userId,
        requestDate: new Date(),
        status: 'pending'
      };

      const requestId = await database.collection('data_export_requests').insertOne(exportRequest);
      
      // Queue background job for data compilation
      await this.queueDataExportJob(requestId.insertedId.toString(), userId);
      
      return requestId.insertedId.toString();
    } catch (error) {
      console.error('Data export request failed:', error);
      throw new Error('Failed to process data export request');
    }
  }

  // Compile user data for export
  static async compileUserData(userId: string): Promise<any> {
    try {
      const userData: any = {
        exportDate: new Date().toISOString(),
        userId,
        personalData: {},
        activityData: {},
        preferences: {},
        consents: []
      };

      // Collect user profile data
      const user = await database.collection('users').findOne({ _id: userId });
      if (user) {
        userData.personalData = {
          email: user.email,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          phone: user.phone,
          registrationDate: user.createdAt,
          lastLogin: user.lastLoginAt,
          profilePicture: user.profile?.avatar
        };
      }

      // Collect course enrollment data
      const enrollments = await database.collection('enrollments')
        .find({ studentId: userId }).toArray();
      userData.activityData.enrollments = enrollments.map(enrollment => ({
        courseId: enrollment.courseId,
        enrollmentDate: enrollment.createdAt,
        completionStatus: enrollment.status,
        progress: enrollment.progress
      }));

      // Collect payment history
      const payments = await database.collection('payments')
        .find({ userId }).toArray();
      userData.activityData.payments = payments.map(payment => ({
        amount: payment.amount,
        currency: payment.currency,
        date: payment.createdAt,
        status: payment.status,
        courseId: payment.courseId
      }));

      // Collect consent records
      const consents = await database.collection('consent_records')
        .find({ userId }).toArray();
      userData.consents = consents;

      // Collect ambassador data if applicable
      const ambassador = await database.collection('ambassadors').findOne({ userId });
      if (ambassador) {
        userData.ambassadorData = {
          referralCode: ambassador.referralCode,
          totalReferrals: ambassador.performance?.totalReferrals,
          totalEarnings: ambassador.performance?.totalEarnings,
          joinDate: ambassador.createdAt
        };
      }

      return userData;
    } catch (error) {
      console.error('Data compilation failed:', error);
      throw new Error('Failed to compile user data');
    }
  }

  // Request data deletion (Right to be forgotten)
  static async requestDataDeletion(userId: string, reason?: string): Promise<string> {
    try {
      const deletionRequest: DataDeletionRequest = {
        userId,
        requestDate: new Date(),
        status: 'pending',
        retentionReason: reason
      };

      const requestId = await database.collection('data_deletion_requests').insertOne(deletionRequest);
      
      // Queue background job for data deletion
      await this.queueDataDeletionJob(requestId.insertedId.toString(), userId);
      
      return requestId.insertedId.toString();
    } catch (error) {
      console.error('Data deletion request failed:', error);
      throw new Error('Failed to process data deletion request');
    }
  }

  // Execute data deletion
  static async executeDataDeletion(userId: string): Promise<void> {
    try {
      // Check for legal retention requirements
      const retentionCheck = await this.checkRetentionRequirements(userId);
      if (retentionCheck.mustRetain) {
        throw new Error(`Cannot delete data: ${retentionCheck.reason}`);
      }

      // Anonymize instead of delete where legally required
      await this.anonymizeUserData(userId);
      
      // Delete non-essential data
      await this.deleteNonEssentialData(userId);
      
      // Update deletion request status
      await database.collection('data_deletion_requests')
        .updateOne(
          { userId, status: 'processing' },
          { 
            $set: { 
              status: 'completed',
              deletionDate: new Date()
            }
          }
        );

    } catch (error) {
      console.error('Data deletion execution failed:', error);
      throw new Error('Failed to execute data deletion');
    }
  }

  // Check retention requirements
  static async checkRetentionRequirements(userId: string): Promise<{ mustRetain: boolean; reason?: string }> {
    // Check for active subscriptions
    const activeSubscriptions = await database.collection('subscriptions')
      .countDocuments({ userId, status: 'active' });
    
    if (activeSubscriptions > 0) {
      return { mustRetain: true, reason: 'Active subscriptions exist' };
    }

    // Check for recent financial transactions (7 years retention for tax purposes)
    const recentPayments = await database.collection('payments')
      .countDocuments({ 
        userId, 
        createdAt: { $gte: new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000) }
      });
    
    if (recentPayments > 0) {
      return { mustRetain: true, reason: 'Financial records must be retained for 7 years' };
    }

    // Check for pending legal matters
    const legalHolds = await database.collection('legal_holds')
      .countDocuments({ userId, status: 'active' });
    
    if (legalHolds > 0) {
      return { mustRetain: true, reason: 'Data subject to legal hold' };
    }

    return { mustRetain: false };
  }

  // Anonymize user data
  static async anonymizeUserData(userId: string): Promise<void> {
    const anonymizedId = `anon_${EncryptionService.generateSecureToken(16)}`;
    
    // Anonymize user profile
    await database.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          email: `${anonymizedId}@anonymized.local`,
          phone: null,
          'profile.firstName': 'Anonymous',
          'profile.lastName': 'User',
          'profile.avatar': null,
          'profile.bio': null,
          anonymized: true,
          anonymizedAt: new Date()
        }
      }
    );

    // Anonymize course reviews
    await database.collection('course_reviews').updateMany(
      { userId },
      {
        $set: {
          authorName: 'Anonymous User',
          anonymized: true
        }
      }
    );

    // Anonymize forum posts
    await database.collection('forum_posts').updateMany(
      { userId },
      {
        $set: {
          authorName: 'Anonymous User',
          anonymized: true
        }
      }
    );
  }

  // Delete non-essential data
  static async deleteNonEssentialData(userId: string): Promise<void> {
    // Delete uploaded files (profile pictures, assignments)
    await database.collection('user_files').deleteMany({ userId });
    
    // Delete notification preferences
    await database.collection('notification_preferences').deleteMany({ userId });
    
    // Delete browsing history
    await database.collection('user_activity_logs').deleteMany({ userId });
    
    // Delete temporary data
    await database.collection('otp_verifications').deleteMany({ userId });
    await database.collection('password_resets').deleteMany({ userId });
  }

  // Consent management
  static async recordConsent(consent: ConsentRecord): Promise<void> {
    try {
      await database.collection('consent_records').insertOne({
        ...consent,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Consent recording failed:', error);
      throw new Error('Failed to record consent');
    }
  }

  // Get user consents
  static async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      return await database.collection('consent_records')
        .find({ userId })
        .sort({ timestamp: -1 })
        .toArray();
    } catch (error) {
      console.error('Failed to retrieve consents:', error);
      throw new Error('Failed to retrieve user consents');
    }
  }

  // Update consent
  static async updateConsent(userId: string, consentType: string, granted: boolean, metadata: any): Promise<void> {
    try {
      const consent: ConsentRecord = {
        userId,
        consentType: consentType as any,
        granted,
        timestamp: new Date(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        version: '1.0'
      };

      await this.recordConsent(consent);
    } catch (error) {
      console.error('Consent update failed:', error);
      throw new Error('Failed to update consent');
    }
  }

  // Data portability - export in machine-readable format
  static async exportDataPortable(userId: string): Promise<string> {
    try {
      const userData = await this.compileUserData(userId);
      
      // Convert to JSON format for portability
      const portableData = {
        format: 'JSON',
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: userData
      };

      return JSON.stringify(portableData, null, 2);
    } catch (error) {
      console.error('Data portability export failed:', error);
      throw new Error('Failed to export portable data');
    }
  }

  // Privacy impact assessment
  static async assessPrivacyImpact(dataProcessingActivity: string): Promise<any> {
    // This would implement a privacy impact assessment framework
    return {
      activity: dataProcessingActivity,
      riskLevel: 'medium',
      mitigationMeasures: [
        'Data encryption at rest and in transit',
        'Access controls and authentication',
        'Regular security audits',
        'Data minimization practices'
      ],
      assessmentDate: new Date()
    };
  }

  // Queue background jobs (placeholder - would integrate with job queue)
  private static async queueDataExportJob(requestId: string, userId: string): Promise<void> {
    // This would integrate with a job queue system like Bull or Agenda
    console.log(`Queued data export job for request ${requestId}, user ${userId}`);
  }

  private static async queueDataDeletionJob(requestId: string, userId: string): Promise<void> {
    // This would integrate with a job queue system
    console.log(`Queued data deletion job for request ${requestId}, user ${userId}`);
  }

  // Data breach notification
  static async notifyDataBreach(incident: any): Promise<void> {
    try {
      // Log the incident
      await database.collection('security_incidents').insertOne({
        ...incident,
        reportedAt: new Date(),
        status: 'reported'
      });

      // Notify relevant authorities if required
      if (incident.severity === 'high') {
        await this.notifyDataProtectionAuthority(incident);
      }

      // Notify affected users if required
      if (incident.affectedUsers && incident.affectedUsers.length > 0) {
        await this.notifyAffectedUsers(incident);
      }
    } catch (error) {
      console.error('Data breach notification failed:', error);
      throw new Error('Failed to process data breach notification');
    }
  }

  private static async notifyDataProtectionAuthority(incident: any): Promise<void> {
    // Implementation would depend on jurisdiction
    console.log('Notifying data protection authority of incident:', incident.id);
  }

  private static async notifyAffectedUsers(incident: any): Promise<void> {
    // Send notifications to affected users
    console.log(`Notifying ${incident.affectedUsers.length} users of security incident`);
  }
}