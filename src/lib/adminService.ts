import { supabaseAdmin } from './database';
import { systemConfigService } from './systemConfigService';

export interface UserManagement {
  id: string;
  email: string;
  role: string;
  profile: any;
  verification: any;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface MentorApproval {
  id: string;
  userId: string;
  mentorName: string;
  email: string;
  applicationData: any;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface CourseModeration {
  id: string;
  title: string;
  mentorId: string;
  mentorName: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  qualityScore?: number;
}

export interface PayoutProcessing {
  id: string;
  userId: string;
  userType: 'mentor' | 'ambassador';
  userName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  transactionId?: string;
  notes?: string;
}

export class AdminService {
  /**
   * Get all users with filtering and pagination
   */
  async getUsers(filters: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: UserManagement[]; total: number }> {
    try {
      let query = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,profile->>firstName.ilike.%${filters.search}%,profile->>lastName.ilike.%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const users: UserManagement[] = data?.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        verification: user.verification,
        createdAt: new Date(user.created_at),
        isActive: user.verification?.emailVerified || false
      })) || [];

      return { users, total: count || 0 };
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, newRole: string, updatedBy: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      // Create audit log
      await systemConfigService.createAuditLog({
        userId: updatedBy,
        action: 'UPDATE',
        resource: 'user_role',
        resourceId: userId,
        newValues: { role: newRole }
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Suspend or activate user
   */
  async updateUserStatus(userId: string, isActive: boolean, updatedBy: string): Promise<void> {
    try {
      const verification = isActive 
        ? { emailVerified: true, phoneVerified: false, kycStatus: 'pending' }
        : { emailVerified: false, phoneVerified: false, kycStatus: 'suspended' };

      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          verification,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;

      // Create audit log
      await systemConfigService.createAuditLog({
        userId: updatedBy,
        action: 'UPDATE',
        resource: 'user_status',
        resourceId: userId,
        newValues: { isActive, verification }
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Get pending mentor applications
   */
  async getPendingMentorApplications(): Promise<MentorApproval[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          profile,
          created_at,
          mentor_applications!inner(
            id,
            application_data,
            status,
            submitted_at,
            reviewed_at,
            reviewed_by,
            review_notes
          )
        `)
        .eq('mentor_applications.status', 'pending')
        .order('mentor_applications.submitted_at', { ascending: false });

      if (error) throw error;

      return data?.map(user => ({
        id: user.mentor_applications[0].id,
        userId: user.id,
        mentorName: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
        email: user.email,
        applicationData: user.mentor_applications[0].application_data,
        status: user.mentor_applications[0].status,
        submittedAt: new Date(user.mentor_applications[0].submitted_at),
        reviewedAt: user.mentor_applications[0].reviewed_at ? new Date(user.mentor_applications[0].reviewed_at) : undefined,
        reviewedBy: user.mentor_applications[0].reviewed_by,
        reviewNotes: user.mentor_applications[0].review_notes
      })) || [];
    } catch (error) {
      console.error('Error getting mentor applications:', error);
      throw error;
    }
  }

  /**
   * Approve or reject mentor application
   */
  async processMentorApplication(
    applicationId: string, 
    decision: 'approved' | 'rejected', 
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<void> {
    try {
      // Update application status
      const { data: application, error: appError } = await supabaseAdmin
        .from('mentor_applications')
        .update({
          status: decision,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
          review_notes: reviewNotes
        })
        .eq('id', applicationId)
        .select('user_id')
        .single();

      if (appError) throw appError;

      // If approved, update user role to mentor
      if (decision === 'approved' && application) {
        await this.updateUserRole(application.user_id, 'mentor', reviewedBy);
      }

      // Create audit log
      await systemConfigService.createAuditLog({
        userId: reviewedBy,
        action: 'UPDATE',
        resource: 'mentor_application',
        resourceId: applicationId,
        newValues: { status: decision, reviewNotes }
      });
    } catch (error) {
      console.error('Error processing mentor application:', error);
      throw error;
    }
  }

  /**
   * Get courses pending moderation
   */
  async getCoursesForModeration(): Promise<CourseModeration[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select(`
          id,
          title,
          mentor_id,
          status,
          created_at,
          updated_at,
          users!inner(profile)
        `)
        .in('status', ['pending_review', 'draft'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map(course => ({
        id: course.id,
        title: course.title,
        mentorId: course.mentor_id,
        mentorName: `${course.users[0]?.profile?.firstName || ''} ${course.users[0]?.profile?.lastName || ''}`.trim(),
        status: course.status,
        submittedAt: new Date(course.created_at),
        reviewedAt: course.updated_at ? new Date(course.updated_at) : undefined
      })) || [];
    } catch (error) {
      console.error('Error getting courses for moderation:', error);
      throw error;
    }
  }

  /**
   * Moderate course (approve/reject)
   */
  async moderateCourse(
    courseId: string,
    decision: 'published' | 'rejected',
    reviewedBy: string,
    reviewNotes?: string,
    qualityScore?: number
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('courses')
        .update({
          status: decision,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (error) throw error;

      // Create moderation record
      await supabaseAdmin
        .from('course_moderations')
        .insert({
          course_id: courseId,
          reviewed_by: reviewedBy,
          decision,
          review_notes: reviewNotes,
          quality_score: qualityScore,
          reviewed_at: new Date().toISOString()
        });

      // Create audit log
      await systemConfigService.createAuditLog({
        userId: reviewedBy,
        action: 'UPDATE',
        resource: 'course_moderation',
        resourceId: courseId,
        newValues: { status: decision, reviewNotes, qualityScore }
      });
    } catch (error) {
      console.error('Error moderating course:', error);
      throw error;
    }
  }

  /**
   * Get pending payouts
   */
  async getPendingPayouts(): Promise<PayoutProcessing[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('payout_requests')
        .select(`
          id,
          user_id,
          amount,
          currency,
          status,
          requested_at,
          processed_at,
          processed_by,
          transaction_id,
          notes,
          users!inner(role, profile)
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      return data?.map(payout => ({
        id: payout.id,
        userId: payout.user_id,
        userType: payout.users[0]?.role === 'mentor' ? 'mentor' : 'ambassador',
        userName: `${payout.users[0]?.profile?.firstName || ''} ${payout.users[0]?.profile?.lastName || ''}`.trim(),
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        requestedAt: new Date(payout.requested_at),
        processedAt: payout.processed_at ? new Date(payout.processed_at) : undefined,
        processedBy: payout.processed_by,
        transactionId: payout.transaction_id,
        notes: payout.notes
      })) || [];
    } catch (error) {
      console.error('Error getting pending payouts:', error);
      throw error;
    }
  }

  /**
   * Process payout (approve/reject)
   */
  async processPayout(
    payoutId: string,
    decision: 'approved' | 'rejected' | 'processed',
    processedBy: string,
    transactionId?: string,
    notes?: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('payout_requests')
        .update({
          status: decision,
          processed_at: new Date().toISOString(),
          processed_by: processedBy,
          transaction_id: transactionId,
          notes
        })
        .eq('id', payoutId);

      if (error) throw error;

      // Create audit log
      await systemConfigService.createAuditLog({
        userId: processedBy,
        action: 'UPDATE',
        resource: 'payout_processing',
        resourceId: payoutId,
        newValues: { status: decision, transactionId, notes }
      });
    } catch (error) {
      console.error('Error processing payout:', error);
      throw error;
    }
  }

  /**
   * Get system statistics for admin dashboard
   */
  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalCourses: number;
    pendingModerations: number;
    pendingPayouts: number;
    totalRevenue: number;
  }> {
    try {
      const [
        totalUsersResult,
        activeUsersResult,
        totalCoursesResult,
        pendingModerationsResult,
        pendingPayoutsResult,
        totalRevenueResult
      ] = await Promise.all([
        supabaseAdmin.from('users').select('count'),
        supabaseAdmin.from('users').select('count').eq('verification->>emailVerified', 'true'),
        supabaseAdmin.from('courses').select('count').eq('status', 'published'),
        supabaseAdmin.from('courses').select('count').in('status', ['pending_review', 'draft']),
        supabaseAdmin.from('payout_requests').select('count').eq('status', 'pending'),
        supabaseAdmin.from('course_enrollments').select('amount_paid')
      ]);

      const totalRevenue = totalRevenueResult.data?.reduce((sum, enrollment) => 
        sum + (enrollment.amount_paid || 0), 0) || 0;

      return {
        totalUsers: totalUsersResult.data?.[0]?.count || 0,
        activeUsers: activeUsersResult.data?.[0]?.count || 0,
        totalCourses: totalCoursesResult.data?.[0]?.count || 0,
        pendingModerations: pendingModerationsResult.data?.[0]?.count || 0,
        pendingPayouts: pendingPayoutsResult.data?.[0]?.count || 0,
        totalRevenue
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();