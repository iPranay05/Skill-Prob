import { supabase } from '@/lib/database';

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

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  category?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStatistics {
  totalLogs: number;
  successfulOperations: number;
  failedOperations: number;
  criticalEvents: number;
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  topUsers: Array<{ userId: string; userEmail: string; count: number }>;
  securityEvents: number;
  authenticationFailures: number;
  suspiciousIPs: Array<{ ipAddress: string; count: number; severity: string }>;
  recentCriticalEvents: Array<AuditLogEntry & { id: string; createdAt: string }>;
}

export class AuditService {
  // Log an activity to the audit trail
  static async logActivity(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
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
          success: entry.success ?? true,
          error_message: entry.errorMessage || null,
          severity: entry.severity || 'low',
          category: entry.category || 'system'
        });

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Don't throw error to avoid breaking the main operation
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Log authentication events
  static async logAuthentication(
    action: 'login' | 'logout' | 'token_refresh' | 'password_reset' | 'email_verification',
    userId?: string,
    userEmail?: string,
    success: boolean = true,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      userEmail,
      action: `auth_${action}`,
      resource: 'authentication',
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success,
      errorMessage,
      severity: success ? 'low' : 'medium',
      category: 'authentication'
    });
  }

  // Log data access events
  static async logDataAccess(
    action: string,
    resource: string,
    resourceId?: string,
    userId?: string,
    userEmail?: string,
    userRole?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      userEmail,
      userRole,
      action: `data_${action}`,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success: true,
      severity: 'low',
      category: 'data_access'
    });
  }

  // Log data modification events
  static async logDataModification(
    action: 'create' | 'update' | 'delete',
    resource: string,
    resourceId: string,
    userId: string,
    userEmail?: string,
    userRole?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      userEmail,
      userRole,
      action: `data_${action}`,
      resource,
      resourceId,
      details: {
        ...details,
        modifiedAt: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success: true,
      severity: action === 'delete' ? 'medium' : 'low',
      category: 'data_modification'
    });
  }

  // Log security events
  static async logSecurityEvent(
    action: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    userId?: string,
    userEmail?: string,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      userEmail,
      action: `security_${action}`,
      resource: 'security',
      details: {
        ...details,
        detectedAt: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success: false,
      errorMessage,
      severity,
      category: 'security'
    });
  }

  // Log system events
  static async logSystemEvent(
    action: string,
    details?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    await this.logActivity({
      action: `system_${action}`,
      resource: 'system',
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        serverTime: new Date().toISOString()
      },
      severity,
      category: 'system'
    });
  }

  // Query audit logs with filters
  static async queryLogs(query: AuditQuery): Promise<{
    logs: Array<AuditLogEntry & { id: string; createdAt: string }>;
    totalCount: number;
  }> {
    try {
      let supabaseQuery = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (query.userId) {
        supabaseQuery = supabaseQuery.eq('user_id', query.userId);
      }

      if (query.action) {
        supabaseQuery = supabaseQuery.eq('action', query.action);
      }

      if (query.resource) {
        supabaseQuery = supabaseQuery.eq('resource', query.resource);
      }

      if (query.severity) {
        supabaseQuery = supabaseQuery.eq('severity', query.severity);
      }

      if (query.category) {
        supabaseQuery = supabaseQuery.eq('category', query.category);
      }

      if (query.success !== undefined) {
        supabaseQuery = supabaseQuery.eq('success', query.success);
      }

      if (query.ipAddress) {
        supabaseQuery = supabaseQuery.eq('ip_address', query.ipAddress);
      }

      if (query.startDate) {
        supabaseQuery = supabaseQuery.gte('created_at', query.startDate.toISOString());
      }

      if (query.endDate) {
        supabaseQuery = supabaseQuery.lte('created_at', query.endDate.toISOString());
      }

      // Apply pagination
      const limit = query.limit || 50;
      const offset = query.offset || 0;

      supabaseQuery = supabaseQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw error;
      }

      const logs = (data || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        userEmail: log.user_email,
        userRole: log.user_role,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        sessionId: log.session_id,
        success: log.success,
        errorMessage: log.error_message,
        severity: log.severity,
        category: log.category,
        createdAt: log.created_at
      }));

      return {
        logs,
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return {
        logs: [],
        totalCount: 0
      };
    }
  }

  // Get audit statistics for dashboard
  static async getStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditStatistics> {
    try {
      const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const defaultEndDate = endDate || new Date();

      // Get basic counts
      const { data: totalData } = await supabase
        .from('audit_logs')
        .select('success, severity, category', { count: 'exact' })
        .gte('created_at', defaultStartDate.toISOString())
        .lte('created_at', defaultEndDate.toISOString());

      const totalLogs = totalData?.length || 0;
      const successfulOperations = totalData?.filter(log => log.success).length || 0;
      const failedOperations = totalLogs - successfulOperations;
      const criticalEvents = totalData?.filter(log => log.severity === 'critical').length || 0;
      const securityEvents = totalData?.filter(log => log.category === 'security').length || 0;
      const authenticationFailures = totalData?.filter(log => 
        log.category === 'authentication' && !log.success
      ).length || 0;

      // Get top actions
      const { data: actionData } = await supabase
        .from('audit_logs')
        .select('action')
        .gte('created_at', defaultStartDate.toISOString())
        .lte('created_at', defaultEndDate.toISOString());

      const actionCounts: Record<string, number> = {};
      actionData?.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      // Get top resources
      const { data: resourceData } = await supabase
        .from('audit_logs')
        .select('resource')
        .gte('created_at', defaultStartDate.toISOString())
        .lte('created_at', defaultEndDate.toISOString());

      const resourceCounts: Record<string, number> = {};
      resourceData?.forEach(log => {
        resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
      });

      const topResources = Object.entries(resourceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([resource, count]) => ({ resource, count }));

      // Get top users
      const { data: userData } = await supabase
        .from('audit_logs')
        .select('user_id, user_email')
        .gte('created_at', defaultStartDate.toISOString())
        .lte('created_at', defaultEndDate.toISOString())
        .not('user_id', 'is', null);

      const userCounts: Record<string, { email: string; count: number }> = {};
      userData?.forEach(log => {
        if (log.user_id) {
          if (!userCounts[log.user_id]) {
            userCounts[log.user_id] = { email: log.user_email || '', count: 0 };
          }
          userCounts[log.user_id].count++;
        }
      });

      const topUsers = Object.entries(userCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([userId, data]) => ({
          userId,
          userEmail: data.email,
          count: data.count
        }));

      // Get suspicious IPs
      const { data: ipData } = await supabase
        .from('audit_logs')
        .select('ip_address, severity, success')
        .gte('created_at', defaultStartDate.toISOString())
        .lte('created_at', defaultEndDate.toISOString())
        .not('ip_address', 'is', null);

      const ipStats: Record<string, { count: number; failures: number; highSeverity: number }> = {};
      ipData?.forEach(log => {
        if (log.ip_address) {
          if (!ipStats[log.ip_address]) {
            ipStats[log.ip_address] = { count: 0, failures: 0, highSeverity: 0 };
          }
          ipStats[log.ip_address].count++;
          if (!log.success) {
            ipStats[log.ip_address].failures++;
          }
          if (['high', 'critical'].includes(log.severity)) {
            ipStats[log.ip_address].highSeverity++;
          }
        }
      });

      const suspiciousIPs = Object.entries(ipStats)
        .filter(([, stats]) => stats.failures >= 5 || stats.highSeverity >= 2)
        .sort(([, a], [, b]) => (b.failures + b.highSeverity * 2) - (a.failures + a.highSeverity * 2))
        .slice(0, 20)
        .map(([ipAddress, stats]) => ({
          ipAddress,
          count: stats.count,
          severity: stats.highSeverity >= 3 ? 'critical' : stats.failures >= 10 ? 'high' : 'medium'
        }));

      // Get recent critical events
      const { data: criticalData } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('severity', 'critical')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(10);

      const recentCriticalEvents = (criticalData || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        userEmail: log.user_email,
        userRole: log.user_role,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        sessionId: log.session_id,
        success: log.success,
        errorMessage: log.error_message,
        severity: log.severity,
        category: log.category,
        createdAt: log.created_at
      }));

      return {
        totalLogs,
        successfulOperations,
        failedOperations,
        criticalEvents,
        topActions,
        topResources,
        topUsers,
        securityEvents,
        authenticationFailures,
        suspiciousIPs,
        recentCriticalEvents
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      return {
        totalLogs: 0,
        successfulOperations: 0,
        failedOperations: 0,
        criticalEvents: 0,
        topActions: [],
        topResources: [],
        topUsers: [],
        securityEvents: 0,
        authenticationFailures: 0,
        suspiciousIPs: [],
        recentCriticalEvents: []
      };
    }
  }

  // Clean up old audit logs (for maintenance)
  static async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw error;
      }

      const deletedCount = Array.isArray(data) ? data.length : 0;
      
      await this.logSystemEvent('audit_cleanup', {
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        deletedCount
      });

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      throw error;
    }
  }

  // Export audit logs for compliance
  static async exportLogs(
    query: AuditQuery,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const { logs } = await this.queryLogs({ ...query, limit: 10000 }); // Large limit for export
      
      if (format === 'csv') {
        const headers = [
          'ID', 'User ID', 'User Email', 'User Role', 'Action', 'Resource', 'Resource ID',
          'IP Address', 'User Agent', 'Session ID', 'Success', 'Error Message',
          'Severity', 'Category', 'Created At', 'Details'
        ];
        
        const csvRows = [
          headers.join(','),
          ...logs.map(log => [
            log.id,
            log.userId || '',
            log.userEmail || '',
            log.userRole || '',
            log.action,
            log.resource,
            log.resourceId || '',
            log.ipAddress || '',
            log.userAgent || '',
            log.sessionId || '',
            log.success,
            log.errorMessage || '',
            log.severity,
            log.category,
            log.createdAt,
            JSON.stringify(log.details || {}).replace(/"/g, '""')
          ].map(field => `"${field}"`).join(','))
        ];
        
        return csvRows.join('\n');
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}