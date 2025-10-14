import { supabase } from '../database';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'payment' | 'course' | 'user' | 'admin' | 'security' | 'system';
  success: boolean;
  errorMessage?: string;
}

export interface SuspiciousActivity {
  id?: string;
  userId?: string;
  activityType: string;
  description: string;
  riskScore: number; // 1-10 scale
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  investigatedBy?: string;
  resolution?: string;
}

export class AuditTrailService {
  // Log audit events
  static async logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.error('Failed to log audit event:', error);
        // Don't throw error to avoid breaking the main operation
      }

      // Log high severity events to console for immediate attention
      if (entry.severity === 'high' || entry.severity === 'critical') {
        console.warn('HIGH SEVERITY AUDIT EVENT:', auditEntry);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Authentication events
  static async logAuthEvent(
    action: 'login' | 'logout' | 'register' | 'password_reset' | 'otp_verification' | 'token_refresh',
    userId?: string,
    userEmail?: string,
    success: boolean = true,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.logEvent({
      userId,
      userEmail,
      action,
      resource: 'authentication',
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: success ? 'low' : 'medium',
      category: 'auth',
      success,
      errorMessage: success ? undefined : details?.error
    });
  }

  // Payment events
  static async logPaymentEvent(
    action: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'refund_processed' | 'payout_requested',
    userId: string,
    amount: number,
    currency: string,
    success: boolean = true,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: 'payment',
      details: { amount, currency, ...details },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: success ? 'medium' : 'high',
      category: 'payment',
      success,
      errorMessage: success ? undefined : details?.error
    });
  }

  // Course management events
  static async logCourseEvent(
    action: 'course_created' | 'course_updated' | 'course_deleted' | 'course_published' | 'enrollment_created',
    userId: string,
    courseId: string,
    success: boolean = true,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: 'course',
      resourceId: courseId,
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: 'low',
      category: 'course',
      success,
      errorMessage: success ? undefined : details?.error
    });
  }

  // User management events
  static async logUserEvent(
    action: 'user_created' | 'user_updated' | 'user_deleted' | 'role_changed' | 'profile_updated',
    targetUserId: string,
    adminUserId?: string,
    success: boolean = true,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.logEvent({
      userId: adminUserId,
      action,
      resource: 'user',
      resourceId: targetUserId,
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: action === 'role_changed' ? 'high' : 'medium',
      category: 'user',
      success,
      errorMessage: success ? undefined : details?.error
    });
  }

  // Admin events
  static async logAdminEvent(
    action: string,
    adminUserId: string,
    resource: string,
    resourceId?: string,
    success: boolean = true,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.logEvent({
      userId: adminUserId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: 'high',
      category: 'admin',
      success,
      errorMessage: success ? undefined : details?.error
    });
  }

  // Security events
  static async logSecurityEvent(
    action: 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_token' | 'unauthorized_access' | 'ip_blocked',
    userId?: string,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: 'security',
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: 'high',
      category: 'security',
      success: false,
      errorMessage: details?.error
    });
  }

  // Log suspicious activity
  static async logSuspiciousActivity(activity: Omit<SuspiciousActivity, 'id' | 'timestamp' | 'status'>): Promise<void> {
    try {
      const suspiciousActivity: SuspiciousActivity = {
        ...activity,
        timestamp: new Date(),
        status: 'detected'
      };

      const { error } = await supabase
        .from('suspicious_activities')
        .insert([suspiciousActivity]);

      if (error) {
        console.error('Failed to log suspicious activity:', error);
      }

      // Alert for high-risk activities
      if (activity.riskScore >= 8) {
        console.error('HIGH RISK SUSPICIOUS ACTIVITY DETECTED:', suspiciousActivity);
        // Here you could integrate with alerting systems like Slack, email, etc.
      }
    } catch (error) {
      console.error('Suspicious activity logging error:', error);
    }
  }

  // Detect suspicious patterns
  static async detectSuspiciousPatterns(userId: string): Promise<SuspiciousActivity[]> {
    const suspiciousActivities: SuspiciousActivity[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    try {
      // Check for multiple failed login attempts
      const { data: failedLogins } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('userId', userId)
        .eq('action', 'login')
        .eq('success', false)
        .gte('timestamp', oneHourAgo.toISOString());

      if (failedLogins && failedLogins.length >= 5) {
        suspiciousActivities.push({
          userId,
          activityType: 'multiple_failed_logins',
          description: `${failedLogins.length} failed login attempts in the last hour`,
          riskScore: Math.min(10, 5 + failedLogins.length),
          timestamp: now,
          status: 'detected'
        });
      }

      // Check for rapid successive actions
      const { data: recentActions } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('userId', userId)
        .gte('timestamp', new Date(now.getTime() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('timestamp', { ascending: false });

      if (recentActions && recentActions.length >= 50) {
        suspiciousActivities.push({
          userId,
          activityType: 'rapid_successive_actions',
          description: `${recentActions.length} actions in 5 minutes`,
          riskScore: 8,
          timestamp: now,
          status: 'detected'
        });
      }

      // Check for unusual IP address patterns
      const { data: ipActions } = await supabase
        .from('audit_logs')
        .select('ipAddress')
        .eq('userId', userId)
        .gte('timestamp', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (ipActions) {
        const uniqueIPs = new Set(ipActions.map(action => action.ipAddress).filter(Boolean));
        if (uniqueIPs.size >= 5) {
          suspiciousActivities.push({
            userId,
            activityType: 'multiple_ip_addresses',
            description: `Access from ${uniqueIPs.size} different IP addresses in 24 hours`,
            riskScore: 6,
            timestamp: now,
            status: 'detected'
          });
        }
      }

      return suspiciousActivities;
    } catch (error) {
      console.error('Error detecting suspicious patterns:', error);
      return [];
    }
  }

  // Get audit logs with filtering
  static async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    category?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditLogEntry[]; count: number }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (filters.userId) query = query.eq('userId', filters.userId);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.severity) query = query.eq('severity', filters.severity);
      if (filters.startDate) query = query.gte('timestamp', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('timestamp', filters.endDate.toISOString());

      query = query
        .order('timestamp', { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 100) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: [], count: 0 };
    }
  }

  // Helper to extract client IP
  private static getClientIP(request?: Request): string | undefined {
    if (!request) return undefined;

    // Check various headers for the real IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;

    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) return cfConnectingIP;

    return undefined;
  }

  // Generate audit report
  static async generateAuditReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    failedEvents: number;
    topUsers: Array<{ userId: string; eventCount: number }>;
    suspiciousActivities: number;
  }> {
    try {
      const { data: events } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (!events) return this.getEmptyReport();

      const eventsByCategory: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};
      const userEventCounts: Record<string, number> = {};
      let failedEvents = 0;

      events.forEach(event => {
        // Count by category
        eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;

        // Count by severity
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

        // Count failed events
        if (!event.success) failedEvents++;

        // Count by user
        if (event.userId) {
          userEventCounts[event.userId] = (userEventCounts[event.userId] || 0) + 1;
        }
      });

      const topUsers = Object.entries(userEventCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, eventCount]) => ({ userId, eventCount }));

      const { count: suspiciousActivities } = await supabase
        .from('suspicious_activities')
        .select('*', { count: 'exact' })
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      return {
        totalEvents: events.length,
        eventsByCategory,
        eventsBySeverity,
        failedEvents,
        topUsers,
        suspiciousActivities: suspiciousActivities || 0
      };
    } catch (error) {
      console.error('Error generating audit report:', error);
      return this.getEmptyReport();
    }
  }

  private static getEmptyReport() {
    return {
      totalEvents: 0,
      eventsByCategory: {},
      eventsBySeverity: {},
      failedEvents: 0,
      topUsers: [],
      suspiciousActivities: 0
    };
  }
}