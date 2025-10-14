import { supabaseAdmin } from '../database';

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  userId?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security';
}

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change' |
  'permission_denied' | 'data_export' | 'data_deletion' | 'suspicious_activity' |
  'rate_limit_exceeded' | 'file_upload' | 'payment_processed' | 'admin_action';
  userId?: string;
  details: any;
  metadata: {
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
  };
}

export class AuditLogger {
  // Log security events
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        timestamp: new Date(),
        userId: event.userId,
        action: event.type,
        resource: this.getResourceFromEventType(event.type),
        details: event.details,
        ipAddress: event.metadata.ipAddress,
        userAgent: event.metadata.userAgent,
        sessionId: event.metadata.sessionId,
        success: this.isSuccessEvent(event.type),
        severity: this.getSeverityFromEventType(event.type),
        category: this.getCategoryFromEventType(event.type)
      };

      await this.writeAuditLog(auditEntry);

      // Check for suspicious patterns
      await this.checkSuspiciousActivity(event);

    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  // Log user actions
  static async logUserAction(
    userId: string,
    action: string,
    resource: string,
    resourceId: string | undefined,
    details: any,
    metadata: { ipAddress: string; userAgent: string; sessionId?: string },
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        timestamp: new Date(),
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        sessionId: metadata.sessionId,
        success,
        errorMessage,
        severity: this.getSeverityFromAction(action),
        category: this.getCategoryFromAction(action)
      };

      await this.writeAuditLog(auditEntry);

    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }

  // Log system events
  static async logSystemEvent(
    action: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        timestamp: new Date(),
        action,
        resource: 'system',
        details,
        ipAddress: 'system',
        userAgent: 'system',
        success: true,
        severity,
        category: 'system'
      };

      await this.writeAuditLog(auditEntry);

    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  // Write audit log to database
  private static async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert(entry);

      if (error) {
        throw error;
      }

      // Also write to separate security log for critical events
      if (entry.severity === 'critical') {
        const { error: securityError } = await supabaseAdmin
          .from('security_logs')
          .insert(entry);

        if (securityError) {
          console.error('Failed to write security log:', securityError);
        }
      }

    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Fallback to file logging if database fails
      await this.writeToFileLog(entry);
    }
  }

  // Fallback file logging
  private static async writeToFileLog(entry: AuditLogEntry): Promise<void> {
    try {
      const logLine = JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: entry.severity.toUpperCase(),
        message: `${entry.action} on ${entry.resource}`,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        success: entry.success,
        details: entry.details
      });

      // This would write to a log file in production
      console.log('AUDIT_LOG:', logLine);

    } catch (error) {
      console.error('Failed to write file log:', error);
    }
  }

  // Check for suspicious activity patterns
  private static async checkSuspiciousActivity(event: SecurityEvent): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check for multiple failed login attempts
      if (event.type === 'login_failure') {
        const { count, error } = await supabaseAdmin
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'login_failure')
          .eq('ipAddress', event.metadata.ipAddress)
          .gte('timestamp', oneHourAgo.toISOString());

        if (!error && count && count >= 5) {
          await this.logSecurityAlert('multiple_login_failures', {
            ipAddress: event.metadata.ipAddress,
            failureCount: count,
            timeWindow: '1 hour'
          });
        }
      }

      // Check for rapid successive actions
      if (event.userId) {
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const { count, error } = await supabaseAdmin
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('userId', event.userId)
          .gte('timestamp', fiveMinutesAgo.toISOString());

        if (!error && count && count >= 50) {
          await this.logSecurityAlert('rapid_successive_actions', {
            userId: event.userId,
            actionCount: count,
            timeWindow: '5 minutes'
          });
        }
      }

      // Check for unusual access patterns (for data export events)
      if (event.type === 'data_export' && event.userId) {
        const { data: userActions, error } = await supabaseAdmin
          .from('audit_logs')
          .select('resourceId')
          .eq('userId', event.userId)
          .eq('category', 'data_access')
          .gte('timestamp', oneHourAgo.toISOString());

        if (!error && userActions) {
          const uniqueResources = new Set(userActions.map(action => action.resourceId).filter(Boolean));
          if (uniqueResources.size >= 20) {
            await this.logSecurityAlert('unusual_data_access_pattern', {
              userId: event.userId,
              resourceCount: uniqueResources.size,
              timeWindow: '1 hour'
            });
          }
        }
      }

    } catch (error) {
      console.error('Failed to check suspicious activity:', error);
    }
  }

  // Log security alerts
  private static async logSecurityAlert(alertType: string, details: any): Promise<void> {
    await this.logSystemEvent(`security_alert_${alertType}`, details, 'high');

    // Send notification to security team
    await this.notifySecurityTeam(alertType, details);
  }

  // Notify security team (placeholder)
  private static async notifySecurityTeam(alertType: string, details: any): Promise<void> {
    console.log(`SECURITY ALERT: ${alertType}`, details);
    // This would integrate with notification system to alert security team
  }

  // Query audit logs
  static async queryAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    category?: string;
    success?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(filters.limit || 100);

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
      }

      if (filters.userId) {
        query = query.eq('userId', filters.userId);
      }

      if (filters.action) {
        query = query.ilike('action', `%${filters.action}%`);
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
        query = query.gte('timestamp', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Failed to query audit logs:', error);
      throw new Error('Failed to retrieve audit logs');
    }
  }

  // Generate audit report
  static async generateAuditReport(
    startDate: Date,
    endDate: Date,
    options: {
      includeUserActions?: boolean;
      includeSystemEvents?: boolean;
      includeSecurityEvents?: boolean;
      groupBy?: 'user' | 'action' | 'resource' | 'day';
    } = {}
  ): Promise<any> {
    try {
      // Build category filter
      const categoryFilter: string[] = [];
      if (options.includeUserActions) categoryFilter.push('data_access', 'data_modification');
      if (options.includeSystemEvents) categoryFilter.push('system');
      if (options.includeSecurityEvents) categoryFilter.push('authentication', 'authorization', 'security');

      // Base query
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (categoryFilter.length > 0) {
        query = query.in('category', categoryFilter);
      }

      const { data: logs, error } = await query;

      if (error) {
        throw error;
      }

      let results: any[] = [];

      if (options.groupBy && logs) {
        // Group data manually since Supabase doesn't support aggregation like MongoDB
        const grouped = new Map<string, any>();

        logs.forEach(log => {
          let groupKey: string;
          switch (options.groupBy) {
            case 'user':
              groupKey = log.userId || 'unknown';
              break;
            case 'action':
              groupKey = log.action;
              break;
            case 'resource':
              groupKey = log.resource;
              break;
            case 'day':
              groupKey = new Date(log.timestamp).toISOString().split('T')[0];
              break;
            default:
              groupKey = log.action;
          }

          if (!grouped.has(groupKey)) {
            grouped.set(groupKey, {
              _id: groupKey,
              count: 0,
              successCount: 0,
              failureCount: 0,
              severityBreakdown: []
            });
          }

          const group = grouped.get(groupKey);
          group.count++;
          if (log.success) {
            group.successCount++;
          } else {
            group.failureCount++;
          }
          group.severityBreakdown.push(log.severity);
        });

        results = Array.from(grouped.values()).sort((a, b) => b.count - a.count);
      } else {
        results = logs || [];
      }

      return {
        reportPeriod: { startDate, endDate },
        generatedAt: new Date(),
        options,
        data: results
      };

    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw new Error('Failed to generate audit report');
    }
  }

  // Helper methods
  private static getResourceFromEventType(eventType: string): string {
    const resourceMap: { [key: string]: string } = {
      'login_attempt': 'authentication',
      'login_success': 'authentication',
      'login_failure': 'authentication',
      'logout': 'authentication',
      'password_change': 'user_account',
      'permission_denied': 'authorization',
      'data_export': 'user_data',
      'data_deletion': 'user_data',
      'suspicious_activity': 'security',
      'rate_limit_exceeded': 'security',
      'file_upload': 'file_system',
      'payment_processed': 'payment',
      'admin_action': 'admin_panel'
    };

    return resourceMap[eventType] || 'unknown';
  }

  private static isSuccessEvent(eventType: string): boolean {
    const successEvents = ['login_success', 'logout', 'password_change', 'data_export', 'file_upload', 'payment_processed'];
    return successEvents.includes(eventType);
  }

  private static getSeverityFromEventType(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: { [key: string]: 'low' | 'medium' | 'high' | 'critical' } = {
      'login_attempt': 'low',
      'login_success': 'low',
      'login_failure': 'medium',
      'logout': 'low',
      'password_change': 'medium',
      'permission_denied': 'high',
      'data_export': 'high',
      'data_deletion': 'critical',
      'suspicious_activity': 'high',
      'rate_limit_exceeded': 'medium',
      'file_upload': 'low',
      'payment_processed': 'medium',
      'admin_action': 'high'
    };

    return severityMap[eventType] || 'low';
  }

  private static getCategoryFromEventType(eventType: string): 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security' {
    const categoryMap: { [key: string]: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security' } = {
      'login_attempt': 'authentication',
      'login_success': 'authentication',
      'login_failure': 'authentication',
      'logout': 'authentication',
      'password_change': 'authentication',
      'permission_denied': 'authorization',
      'data_export': 'data_access',
      'data_deletion': 'data_modification',
      'suspicious_activity': 'security',
      'rate_limit_exceeded': 'security',
      'file_upload': 'data_modification',
      'payment_processed': 'data_modification',
      'admin_action': 'system'
    };

    return categoryMap[eventType] || 'system';
  }

  private static getSeverityFromAction(action: string): 'low' | 'medium' | 'high' | 'critical' {
    if (action.includes('delete') || action.includes('remove')) return 'high';
    if (action.includes('create') || action.includes('update')) return 'medium';
    if (action.includes('read') || action.includes('view')) return 'low';
    return 'low';
  }

  private static getCategoryFromAction(action: string): 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security' {
    if (action.includes('login') || action.includes('auth')) return 'authentication';
    if (action.includes('permission') || action.includes('access')) return 'authorization';
    if (action.includes('read') || action.includes('view') || action.includes('get')) return 'data_access';
    if (action.includes('create') || action.includes('update') || action.includes('delete')) return 'data_modification';
    if (action.includes('system') || action.includes('config')) return 'system';
    return 'data_access';
  }
}