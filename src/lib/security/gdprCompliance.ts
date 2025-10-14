import { supabaseAdmin } from '../database';
import { EncryptionService } from './encryption';

export interface ConsentRecord {
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'cookies';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
}

export interface DataExportRequest {
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface DataDeletionRequest {
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
  reason?: string;
  retentionOverride?: boolean;
}

export interface SecurityIncident {
  type: 'data_breach' | 'unauthorized_access' | 'system_compromise' | 'privacy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedUsers?: string[];
  affectedData?: string[];
  detectedAt: Date;
  reportedBy: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
}

export class GDPRComplianceService {
  // Request data export (Right to Data Portability)
  static async requestDataExport(userId: string): Promise<string> {
    try {
      const exportRequest: DataExportRequest = {
        userId,
        requestedAt: new Date(),
        status: 'pending'
      };

      const { data, error } = await supabaseAdmin
        .from('data_export_requests')
        .insert(exportRequest)
        .select('id')
        .single();

      if (error) throw error;

      // Queue background job for data compilation
      await this.queueDataExportJob(data.id);
      
      return data.id;
    } catch (error) {
      console.error('Error requesting data export:', error);
      throw new Error('Failed to request data export');
    }
  }

  // Compile user data for export
  static async compileUserData(userId: string): Promise<any> {
    try {
      const userData: any = {
        personalData: {},
        activityData: {
          enrollments: [],
          payments: [],
          sessions: []
        },
        consents: [],
        ambassadorData: null
      };

      // Collect user profile data
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (user) {
        userData.personalData = {
          email: user.email,
          profile: user.profile,
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at
        };
      }

      // Collect course enrollment data
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('*')
        .eq('student_id', userId);

      if (enrollments) {
        userData.activityData.enrollments = enrollments.map((enrollment: any) => ({
          courseId: enrollment.course_id,
          enrollmentDate: enrollment.created_at,
          completionStatus: enrollment.status,
          progress: enrollment.progress
        }));
      }

      // Collect payment history
      const { data: payments } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', userId);

      if (payments) {
        userData.activityData.payments = payments.map((payment: any) => ({
          amount: payment.amount,
          currency: payment.currency,
          date: payment.created_at,
          status: payment.status
        }));
      }

      // Collect consent records
      const { data: consents } = await supabaseAdmin
        .from('consent_records')
        .select('*')
        .eq('user_id', userId);

      userData.consents = consents || [];

      // Collect ambassador data if applicable
      const { data: ambassador } = await supabaseAdmin
        .from('ambassadors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (ambassador) {
        userData.ambassadorData = {
          joinedAt: ambassador.created_at,
          totalReferrals: ambassador.total_referrals,
          totalEarnings: ambassador.total_earnings,
          status: ambassador.status
        };
      }

      return userData;
    } catch (error) {
      console.error('Error compiling user data:', error);
      throw new Error('Failed to compile user data');
    }
  }

  // Request data deletion (Right to be Forgotten)
  static async requestDataDeletion(userId: string, reason?: string): Promise<string> {
    try {
      const deletionRequest: DataDeletionRequest = {
        userId,
        requestedAt: new Date(),
        status: 'pending',
        reason
      };

      const { data, error } = await supabaseAdmin
        .from('data_deletion_requests')
        .insert(deletionRequest)
        .select('id')
        .single();

      if (error) throw error;

      // Queue background job for data deletion
      await this.queueDataDeletionJob(data.id);
      
      return data.id;
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      throw new Error('Failed to request data deletion');
    }
  }

  // Process data deletion request
  static async processDataDeletion(userId: string): Promise<void> {
    try {
      // Check retention requirements
      const retentionCheck = await this.checkRetentionRequirements(userId);
      
      if (retentionCheck.mustRetain) {
        // Update deletion request status
        await supabaseAdmin
          .from('data_deletion_requests')
          .update({
            status: 'failed',
            completed_at: new Date(),
            reason: retentionCheck.reason
          })
          .eq('user_id', userId)
          .eq('status', 'processing');
        
        throw new Error(`Cannot delete data: ${retentionCheck.reason}`);
      }

      // Proceed with anonymization instead of deletion for audit trail
      await this.anonymizeUserData(userId);
      
      // Delete non-essential data
      await this.deleteNonEssentialData(userId);
      
      // Update deletion request status
      await supabaseAdmin
        .from('data_deletion_requests')
        .update({
          status: 'completed',
          completed_at: new Date()
        })
        .eq('user_id', userId)
        .eq('status', 'processing');

    } catch (error) {
      console.error('Error processing data deletion:', error);
      throw error;
    }
  }

  // Check if data must be retained for legal/business reasons
  static async checkRetentionRequirements(userId: string): Promise<{ mustRetain: boolean; reason?: string }> {
    // Check for active subscriptions
    const { count: activeSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (activeSubscriptions && activeSubscriptions > 0) {
      return { mustRetain: true, reason: 'User has active subscriptions' };
    }

    // Check for recent financial transactions (7 years retention for tax purposes)
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

    const { count: recentPayments } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', sevenYearsAgo.toISOString());

    if (recentPayments && recentPayments > 0) {
      return { mustRetain: true, reason: 'Recent financial transactions require 7-year retention' };
    }

    // Check for pending legal matters
    const { count: legalHolds } = await supabaseAdmin
      .from('legal_holds')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (legalHolds && legalHolds > 0) {
      return { mustRetain: true, reason: 'User data is under legal hold' };
    }

    return { mustRetain: false };
  }

  // Anonymize user data
  static async anonymizeUserData(userId: string): Promise<void> {
    const anonymizedId = `anon_${EncryptionService.generateToken(16)}`;
    
    // Anonymize user profile
    await supabaseAdmin
      .from('users')
      .update({
        email: `${anonymizedId}@anonymized.local`,
        profile: {
          firstName: 'Anonymous',
          lastName: 'User',
          phone: null,
          dateOfBirth: null,
          address: null
        }
      })
      .eq('id', userId);

    // Anonymize course reviews
    await supabaseAdmin
      .from('course_reviews')
      .update({
        reviewer_name: 'Anonymous User',
        reviewer_email: `${anonymizedId}@anonymized.local`
      })
      .eq('user_id', userId);

    // Anonymize forum posts
    await supabaseAdmin
      .from('forum_posts')
      .update({
        author_name: 'Anonymous User'
      })
      .eq('user_id', userId);
  }

  // Delete non-essential data
  static async deleteNonEssentialData(userId: string): Promise<void> {
    // Delete uploaded files (profile pictures, assignments)
    await supabaseAdmin.from('user_files').delete().eq('user_id', userId);
    
    // Delete notification preferences
    await supabaseAdmin.from('notification_preferences').delete().eq('user_id', userId);
    
    // Delete browsing history
    await supabaseAdmin.from('user_activity_logs').delete().eq('user_id', userId);
    
    // Delete temporary data
    await supabaseAdmin.from('otp_verifications').delete().eq('user_id', userId);
    await supabaseAdmin.from('password_resets').delete().eq('user_id', userId);
  }

  // Record user consent
  static async recordConsent(consent: ConsentRecord): Promise<void> {
    try {
      await supabaseAdmin
        .from('consent_records')
        .insert({
          ...consent,
          timestamp: new Date()
        });
    } catch (error) {
      console.error('Error recording consent:', error);
      throw new Error('Failed to record consent');
    }
  }

  // Get user consents
  static async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('consent_records')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user consents:', error);
      throw new Error('Failed to fetch user consents');
    }
  }

  // Validate consent for specific purpose
  static async validateConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('consent_records')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.granted || false;
    } catch (error) {
      console.error('Error validating consent:', error);
      return false;
    }
  }

  // Generate privacy policy compliance report
  static async generateComplianceReport(): Promise<any> {
    try {
      const report = {
        generatedAt: new Date(),
        dataProcessingActivities: await this.getDataProcessingActivities(),
        consentMetrics: await this.getConsentMetrics(),
        dataRetentionStatus: await this.getDataRetentionStatus(),
        securityIncidents: await this.getSecurityIncidents(),
        userRights: await this.getUserRightsMetrics()
      };

      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  // Report security incident
  static async reportSecurityIncident(incident: SecurityIncident): Promise<string> {
    try {
      // Log the incident
      const { data, error } = await supabaseAdmin
        .from('security_incidents')
        .insert({
          ...incident,
          reported_at: new Date(),
          status: 'open'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Notify relevant stakeholders
      await this.notifySecurityIncident(data.id, incident);
      
      return data.id;
    } catch (error) {
      console.error('Error reporting security incident:', error);
      throw new Error('Failed to report security incident');
    }
  }

  // Private helper methods
  private static async queueDataExportJob(requestId: string): Promise<void> {
    // Implementation would queue a background job
    console.log(`Queued data export job for request ${requestId}`);
  }

  private static async queueDataDeletionJob(requestId: string): Promise<void> {
    // Implementation would queue a background job
    console.log(`Queued data deletion job for request ${requestId}`);
  }

  private static async getDataProcessingActivities(): Promise<any[]> {
    // Implementation would return data processing activities
    return [];
  }

  private static async getConsentMetrics(): Promise<any> {
    // Implementation would return consent metrics
    return {};
  }

  private static async getDataRetentionStatus(): Promise<any> {
    // Implementation would return data retention status
    return {};
  }

  private static async getSecurityIncidents(): Promise<any[]> {
    // Implementation would return recent security incidents
    return [];
  }

  private static async getUserRightsMetrics(): Promise<any> {
    // Implementation would return user rights exercise metrics
    return {};
  }

  private static async notifySecurityIncident(incidentId: string, incident: SecurityIncident): Promise<void> {
    // Implementation would notify relevant stakeholders
    console.log(`Security incident ${incidentId} reported: ${incident.type}`);
  }
}