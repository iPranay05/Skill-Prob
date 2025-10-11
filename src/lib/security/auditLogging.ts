import { supabaseAdmin } from '@/lib/database';

export interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success?: boolean;
  errorMessage?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security';
}

export interface SecurityEvent {
  type: 'suspicious_activity' | 'failed_login' | 'rate_limit_exceeded' | 'unauthorized_access' | 'data_breach' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLoggingService {
  // Log audit entry to database
  static async logAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      const auditEntry = {
        user_id: entry.userId || null,
        user_email: entry.userEmail || null,
        user_role: entry.userRole || null,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId || null,
        details: entry.details || {},
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null,
        session_id: entry.sessionId || null,
        success: entry.success !== false, // Default to true
        error_message: entry.errorMessage || null,
        severity: entry.severity || 'low',
        category: entry.category || 'system',
        created_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.error('Failed to insert audit log:', error);
        // Don't throw error to avoid breaking the main operation
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Log to fallback system or file if database fails
      this.logToFallback(entry, error);
    }
  }

  // Log authentication events
  static async logAuthEvent(
    action: 'login' | 'logout' | 'register' | 'password_reset' | 'otp_verify',
    userId?: string,
    userEmail?: string,
    success: boolean = true,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
    additionalDetails?: Record<string, any>
  ): Promise<void> {
    await this.logAuditEntry({
      userId,
      userEmail,
      action,
      resource: 'authentication',
      success,
      ipAddress,
      userAgent,
      errorMessage,
      severity: success ? 'low' : 'medium',
      category: 'authentication',
      details: {
        ...additionalDetails,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Log data access events
  static async logDataAccess(
    action: 'read' | 'create' | 'update' | 'delete',
    resource: string,
    resourceId?: string,
    userId?: string,
    userRole?: string,
    success: boolean = true,
    ipAddress?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logAuditEntry({
      userId,
      userRole,
      action: `${action}_${resource}`,
      resource,
      resourceId,
      success,
      ipAddress,
      severity: action === 'delete' ? 'high' : 'low',
      category: action === 'read' ? 'data_access' : 'data_modification',
      details
    });
  }

  // Log security events
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.logAuditEntry({
      userId: event.userId,
      action: event.type,
      resource: 'security',
      success: false,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      errorMessage: event.description,
      severity: event.severity,
      category: 'security',
      details: {
        eventType: event.type,
        description: event.description,
        metadata: event.metadata,
        timestamp: new Date().toISOString()
      }
    });

    // For critical security events, also trigger alerts
    if (event.severity === 'critical') {
      await this.triggerSecurityAlert(event);
    }
  }

  // Log payment events
  static async logPaymentEvent(
    action: 'payment_attempt' | 'payment_success' | 'payment_failed' | 'refund' | 'subscription_change',
    userId: string,
    amount?: number,
    currency?: string,
    paymentMethodId?: string,
    success: boolean = true,
    errorMessage?: string,
    additionalDetails?: Record<string, any>
  ): Promise<void> {
    await this.logAuditEntry({
      userId,
      action,
      resource: 'payment',
      success,
      errorMessage,
      severity: success ? 'low' : 'medium',
      category: 'data_modification',
      details: {
        amount,
        currency,
        paymentMethodId,
        ...additionalDetails,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Log admin actions
  static async logAdminAction(
    action: string,
    resource: string,
    resourceId?: string,
    adminUserId?: string,
    adminRole?: string,
    targetUserId?: string,
    success: boolean = true,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logAuditEntry({
      userId: adminUserId,
      userRole: adminRole,
      action: `admin_${action}`,
      resource,
      resourceId,
      success,
      severity: 'high', // Admin actions are always high severity
      category: 'authorization',
      details: {
        targetUserId,
        adminAction: action,
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Query audit logs with filters
  static async queryAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    try {
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.resource) {
        query = query.eq('resource', filters.resource);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      // Order by most recent first
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error querying audit logs:', error);
        throw error;
      }

      return {
        logs: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error querying audit logs:', error);
      throw error;
    }
  }

  // Get audit statistics
  static async getAuditStatistics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    criticalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsByAction: Record<string, number>;
    topUsers: Array<{ userId: string; eventCount: number }>;
  }> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw error;
      }

      const logs = data || [];
      const totalEvents = logs.length;
      const successfulEvents = logs.filter(log => log.success).length;
      const failedEvents = totalEvents - successfulEvents;
      const criticalEvents = logs.filter(log => log.severity === 'critical').length;

      // Group by category
      const eventsByCategory: Record<string, number> = {};
      logs.forEach(log => {
        eventsByCategory[log.category] = (eventsByCategory[log.category] || 0) + 1;
      });

      // Group by action
      const eventsByAction: Record<string, number> = {};
      logs.forEach(log => {
        eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;
      });

      // Top users by event count
      const userEventCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (log.user_id) {
          userEventCounts[log.user_id] = (userEventCounts[log.user_id] || 0) + 1;
        }
      });

      const topUsers = Object.entries(userEventCounts)
        .map(([userId, eventCount]) => ({ userId, eventCount }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      return {
        totalEvents,
        successfulEvents,
        failedEvents,
        criticalEvents,
        eventsByCategory,
        eventsByAction,
        topUsers
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }

  // Detect suspicious patterns in audit logs
  static async detectSuspiciousActivity(userId?: string): Promise<{
    suspiciousActivities: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      count: number;
      lastOccurrence: Date;
    }>;
    riskScore: number;
  }> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      let query = supabaseAdmin
        .from('audit_logs')
        .select('*')
        .gte('created_at', last24Hours.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const logs = data || [];
      const suspiciousActivities: Array<{
        type: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        count: number;
        lastOccurrence: Date;
      }> = [];

      let riskScore = 0;

      // Check for multiple failed login attempts
      const failedLogins = logs.filter(log => 
        log.action === 'login' && !log.success
      );
      if (failedLogins.length >= 5) {
        suspiciousActivities.push({
          type: 'multiple_failed_logins',
          description: `${failedLogins.length} failed login attempts in 24 hours`,
          severity: 'high',
          count: failedLogins.length,
          lastOccurrence: new Date(failedLogins[0].created_at)
        });
        riskScore += 30;
      }

      // Check for unusual access patterns
      const accessLogs = logs.filter(log => log.category === 'data_access');
      if (accessLogs.length > 100) {
        suspiciousActivities.push({
          type: 'excessive_data_access',
          description: `${accessLogs.length} data access events in 24 hours`,
          severity: 'medium',
          count: accessLogs.length,
          lastOccurrence: new Date(accessLogs[0].created_at)
        });
        riskScore += 20;
      }

      // Check for privilege escalation attempts
      const authorizationFailures = logs.filter(log => 
        log.category === 'authorization' && !log.success
      );
      if (authorizationFailures.length >= 3) {
        suspiciousActivities.push({
          type: 'authorization_failures',
          description: `${authorizationFailures.length} authorization failures in 24 hours`,
          severity: 'high',
          count: authorizationFailures.length,
          lastOccurrence: new Date(authorizationFailures[0].created_at)
        });
        riskScore += 25;
      }

      // Check for unusual payment activity
      const paymentFailures = logs.filter(log => 
        log.resource === 'payment' && !log.success
      );
      if (paymentFailures.length >= 5) {
        suspiciousActivities.push({
          type: 'payment_failures',
          description: `${paymentFailures.length} payment failures in 24 hours`,
          severity: 'high',
          count: paymentFailures.length,
          lastOccurrence: new Date(paymentFailures[0].created_at)
        });
        riskScore += 35;
      }

      // Check for rapid sequential actions
      const sortedLogs = logs.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      let rapidSequenceCount = 0;
      for (let i = 1; i < sortedLogs.length; i++) {
        const timeDiff = new Date(sortedLogs[i].created_at).getTime() - 
                        new Date(sortedLogs[i-1].created_at).getTime();
        if (timeDiff < 1000) { // Less than 1 second apart
          rapidSequenceCount++;
        }
      }

      if (rapidSequenceCount > 10) {
        suspiciousActivities.push({
          type: 'rapid_sequential_actions',
          description: `${rapidSequenceCount} actions performed within 1 second intervals`,
          severity: 'medium',
          count: rapidSequenceCount,
          lastOccurrence: new Date(sortedLogs[sortedLogs.length - 1].created_at)
        });
        riskScore += 15;
      }

      return {
        suspiciousActivities,
        riskScore
      };
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return {
        suspiciousActivities: [],
        riskScore: 0
      };
    }
  }

  // Trigger security alert for critical events
  private static async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Send notifications to security team
      // 2. Create incident tickets
      // 3. Trigger automated responses
      // 4. Update security dashboards
      
      console.warn('CRITICAL SECURITY EVENT:', {
        type: event.type,
        description: event.description,
        userId: event.userId,
        ipAddress: event.ipAddress,
        timestamp: new Date().toISOString()
      });

      // Log the alert itself
      await this.logAuditEntry({
        action: 'security_alert_triggered',
        resource: 'security_system',
        success: true,
        severity: 'critical',
        category: 'security',
        details: {
          originalEvent: event,
          alertTriggeredAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error triggering security alert:', error);
    }
  }

  // Fallback logging when database is unavailable
  private static logToFallback(entry: AuditLogEntry, error: any): void {
    const fallbackEntry = {
      timestamp: new Date().toISOString(),
      entry,
      error: error.message,
      fallbackReason: 'Database unavailable'
    };

    // In production, this would write to a file, send to external logging service, etc.
    console.error('FALLBACK AUDIT LOG:', JSON.stringify(fallbackEntry, null, 2));
  }

  // Clean up old audit logs (retention policy)
  static async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw error;
      }

      const deletedCount = data?.length || 0;
      
      // Log the cleanup operation
      await this.logAuditEntry({
        action: 'audit_log_cleanup',
        resource: 'audit_logs',
        success: true,
        severity: 'low',
        category: 'system',
        details: {
          retentionDays,
          cutoffDate: cutoffDate.toISOString(),
          deletedCount
        }
      });

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      throw error;
    }
  }
}