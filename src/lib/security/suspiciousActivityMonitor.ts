import { redis } from '@/lib/database';
import { AuditService } from './auditService';
import { RateLimitService } from './rateLimiting';

export interface SuspiciousActivity {
  identifier: string;
  type: 'rate_limit_abuse' | 'login_anomaly' | 'payment_fraud' | 'data_scraping' | 'bot_behavior' | 'geo_anomaly' | 'user_abuse' | 'distributed_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  conditions: {
    threshold: number;
    timeWindow: number; // in milliseconds
    field: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  }[];
  actions: {
    type: 'block' | 'alert' | 'log';
    duration?: number; // for block actions
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

export interface SecurityAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  identifier: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export class SuspiciousActivityMonitor {
  private static readonly ALERT_RULES: AlertRule[] = [
    {
      id: 'rapid_login_attempts',
      name: 'Rapid Login Attempts',
      type: 'authentication',
      enabled: true,
      conditions: [
        { threshold: 10, timeWindow: 5 * 60 * 1000, field: 'login_attempts', operator: 'gte' }
      ],
      actions: [
        { type: 'block', duration: 30 * 60 * 1000, severity: 'medium' },
        { type: 'alert', severity: 'medium' }
      ]
    },
    {
      id: 'multiple_payment_failures',
      name: 'Multiple Payment Failures',
      type: 'payment',
      enabled: true,
      conditions: [
        { threshold: 5, timeWindow: 60 * 60 * 1000, field: 'payment_failures', operator: 'gte' }
      ],
      actions: [
        { type: 'block', duration: 60 * 60 * 1000, severity: 'high' },
        { type: 'alert', severity: 'high' }
      ]
    },
    {
      id: 'high_api_usage',
      name: 'Abnormally High API Usage',
      type: 'api_abuse',
      enabled: true,
      conditions: [
        { threshold: 1000, timeWindow: 60 * 60 * 1000, field: 'api_requests', operator: 'gte' }
      ],
      actions: [
        { type: 'alert', severity: 'medium' },
        { type: 'log', severity: 'medium' }
      ]
    },
    {
      id: 'data_scraping_pattern',
      name: 'Data Scraping Pattern',
      type: 'data_access',
      enabled: true,
      conditions: [
        { threshold: 100, timeWindow: 10 * 60 * 1000, field: 'course_views', operator: 'gte' },
        { threshold: 50, timeWindow: 10 * 60 * 1000, field: 'user_profiles_viewed', operator: 'gte' }
      ],
      actions: [
        { type: 'block', duration: 2 * 60 * 60 * 1000, severity: 'high' },
        { type: 'alert', severity: 'high' }
      ]
    },
    {
      id: 'bot_behavior',
      name: 'Bot-like Behavior',
      type: 'bot_detection',
      enabled: true,
      conditions: [
        { threshold: 50, timeWindow: 60 * 1000, field: 'requests_per_minute', operator: 'gte' }
      ],
      actions: [
        { type: 'block', duration: 15 * 60 * 1000, severity: 'medium' },
        { type: 'alert', severity: 'medium' }
      ]
    },
    {
      id: 'account_enumeration',
      name: 'Account Enumeration Attempt',
      type: 'reconnaissance',
      enabled: true,
      conditions: [
        { threshold: 20, timeWindow: 5 * 60 * 1000, field: 'user_lookup_attempts', operator: 'gte' }
      ],
      actions: [
        { type: 'block', duration: 60 * 60 * 1000, severity: 'high' },
        { type: 'alert', severity: 'high' }
      ]
    }
  ];

  // Report suspicious activity
  static async reportSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
    try {
      const timestamp = activity.timestamp || new Date();
      const key = `suspicious_activity:${activity.identifier}:${activity.type}`;

      // Store the activity in Redis with expiration
      await redis.setex(
        key,
        24 * 60 * 60, // 24 hours
        JSON.stringify({
          ...activity,
          timestamp: timestamp.toISOString()
        })
      );

      // Log to audit trail
      await AuditService.logSecurityEvent(
        `suspicious_activity_${activity.type}`,
        activity.severity,
        {
          identifier: activity.identifier,
          activityType: activity.type,
          ...activity.details
        },
        activity.details.userId,
        activity.details.userEmail,
        activity.details.ipAddress,
        activity.details.userAgent
      );

      // Check if this triggers any alert rules
      await this.checkAlertRules(activity);

      // Update activity counters for pattern detection
      await this.updateActivityCounters(activity);

    } catch (error) {
      console.error('Error reporting suspicious activity:', error);
    }
  }

  // Check alert rules against the activity
  private static async checkAlertRules(activity: SuspiciousActivity): Promise<void> {
    const relevantRules = this.ALERT_RULES.filter(rule =>
      rule.enabled && (rule.type === activity.type || rule.type === 'general')
    );

    for (const rule of relevantRules) {
      try {
        const triggered = await this.evaluateRule(rule, activity);
        if (triggered) {
          await this.executeRuleActions(rule, activity);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }
  }

  // Evaluate if a rule is triggered
  private static async evaluateRule(rule: AlertRule, activity: SuspiciousActivity): Promise<boolean> {
    for (const condition of rule.conditions) {
      const value = await this.getMetricValue(activity.identifier, condition.field, condition.timeWindow);

      if (!this.compareValues(value, condition.operator, condition.threshold)) {
        return false; // All conditions must be met
      }
    }

    return true;
  }

  // Get metric value for evaluation
  private static async getMetricValue(identifier: string, field: string, timeWindow: number): Promise<number> {
    const now = Date.now();
    const windowStart = now - timeWindow;

    try {
      switch (field) {
        case 'login_attempts':
          return await this.getActivityCount(identifier, 'auth_login', timeWindow);

        case 'payment_failures':
          return await this.getFailedActivityCount(identifier, 'payment', timeWindow);

        case 'api_requests':
          return await this.getActivityCount(identifier, 'api', timeWindow);

        case 'course_views':
          return await this.getActivityCount(identifier, 'course_view', timeWindow);

        case 'user_profiles_viewed':
          return await this.getActivityCount(identifier, 'profile_view', timeWindow);

        case 'requests_per_minute':
          const totalRequests = await this.getActivityCount(identifier, 'api', 60 * 1000);
          return totalRequests;

        case 'user_lookup_attempts':
          return await this.getActivityCount(identifier, 'user_lookup', timeWindow);

        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error getting metric value for ${field}:`, error);
      return 0;
    }
  }

  // Get activity count from rate limiting data
  private static async getActivityCount(identifier: string, action: string, timeWindow: number): Promise<number> {
    try {
      const key = `rate_limit:${action}:${identifier}`;
      const now = Date.now();
      const windowStart = now - timeWindow;

      return await redis.zcount(key, windowStart, now);
    } catch (error) {
      console.error(`Error getting activity count for ${action}:`, error);
      return 0;
    }
  }

  // Get failed activity count
  private static async getFailedActivityCount(identifier: string, action: string, timeWindow: number): Promise<number> {
    try {
      const key = `failed_${action}:${identifier}`;
      const now = Date.now();
      const windowStart = now - timeWindow;

      return await redis.zcount(key, windowStart, now);
    } catch (error) {
      console.error(`Error getting failed activity count for ${action}:`, error);
      return 0;
    }
  }

  // Compare values based on operator
  private static compareValues(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  // Execute rule actions
  private static async executeRuleActions(rule: AlertRule, activity: SuspiciousActivity): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'block':
            await RateLimitService.blockIdentifier(
              activity.identifier,
              action.duration || 60 * 60 * 1000, // Default 1 hour
              `Automatic block due to rule: ${rule.name}`
            );
            break;

          case 'alert':
            await this.createAlert({
              id: `${rule.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ruleId: rule.id,
              ruleName: rule.name,
              identifier: activity.identifier,
              type: activity.type,
              severity: action.severity,
              message: `Rule "${rule.name}" triggered for ${activity.identifier}`,
              details: {
                rule: rule,
                activity: activity,
                triggeredAt: new Date().toISOString()
              },
              createdAt: new Date(),
              acknowledged: false
            });
            break;

          case 'log':
            await AuditService.logSecurityEvent(
              `rule_triggered_${rule.id}`,
              action.severity,
              {
                ruleId: rule.id,
                ruleName: rule.name,
                identifier: activity.identifier,
                activityType: activity.type,
                triggeredConditions: rule.conditions
              }
            );
            break;
        }
      } catch (error) {
        console.error(`Error executing action ${action.type} for rule ${rule.id}:`, error);
      }
    }
  }

  // Create security alert
  private static async createAlert(alert: SecurityAlert): Promise<void> {
    try {
      const key = `security_alert:${alert.id}`;
      await redis.setex(
        key,
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify(alert)
      );

      // Also add to alerts list for easy retrieval
      await redis.zadd('security_alerts', Date.now(), alert.id);

      // Log critical alerts to audit trail
      if (alert.severity === 'critical' || alert.severity === 'high') {
        await AuditService.logSecurityEvent(
          'security_alert_created',
          alert.severity,
          {
            alertId: alert.id,
            ruleId: alert.ruleId,
            ruleName: alert.ruleName,
            identifier: alert.identifier,
            message: alert.message
          }
        );
      }

    } catch (error) {
      console.error('Error creating security alert:', error);
    }
  }

  // Update activity counters for pattern detection
  private static async updateActivityCounters(activity: SuspiciousActivity): Promise<void> {
    try {
      const now = Date.now();
      const counters = [
        `activity_counter:${activity.type}:${activity.identifier}`,
        `activity_counter:${activity.type}:global`,
        `activity_counter:severity:${activity.severity}:${activity.identifier}`,
        `activity_counter:severity:${activity.severity}:global`
      ];

      for (const counter of counters) {
        await redis.zadd(counter, now, `${now}-${Math.random()}`);
        await redis.expire(counter, 24 * 60 * 60); // 24 hours
      }

    } catch (error) {
      console.error('Error updating activity counters:', error);
    }
  }

  // Get recent suspicious activities
  static async getRecentActivities(
    limit: number = 50,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<SuspiciousActivity[]> {
    try {
      const pattern = severity
        ? `suspicious_activity:*:*`
        : `suspicious_activity:*:*`;

      const keys = await redis.keys(pattern);
      const activities: SuspiciousActivity[] = [];

      for (const key of keys.slice(0, limit)) {
        try {
          const data = await redis.get(key);
          if (data) {
            const activity = JSON.parse(data);
            if (!severity || activity.severity === severity) {
              activities.push(activity);
            }
          }
        } catch (error) {
          console.error(`Error parsing activity data for key ${key}:`, error);
        }
      }

      // Sort by timestamp (most recent first)
      return activities.sort((a, b) =>
        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );

    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  // Get security alerts
  static async getAlerts(
    limit: number = 50,
    acknowledged?: boolean
  ): Promise<SecurityAlert[]> {
    try {
      const alertIds = await redis.zrevrange('security_alerts', 0, limit - 1);
      const alerts: SecurityAlert[] = [];

      for (const alertId of alertIds) {
        try {
          const data = await redis.get(`security_alert:${alertId}`);
          if (data) {
            const alert = JSON.parse(data);
            if (acknowledged === undefined || alert.acknowledged === acknowledged) {
              alerts.push(alert);
            }
          }
        } catch (error) {
          console.error(`Error parsing alert data for ${alertId}:`, error);
        }
      }

      return alerts;

    } catch (error) {
      console.error('Error getting security alerts:', error);
      return [];
    }
  }

  // Acknowledge security alert
  static async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<void> {
    try {
      const key = `security_alert:${alertId}`;
      const data = await redis.get(key);

      if (data) {
        const alert = JSON.parse(data);
        alert.acknowledged = true;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = new Date();

        await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(alert));

        await AuditService.logSecurityEvent(
          'security_alert_acknowledged',
          'low',
          {
            alertId,
            acknowledgedBy,
            originalSeverity: alert.severity
          }
        );
      }

    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Get security statistics
  static async getSecurityStatistics(): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    activitiesBySeverity: Record<string, number>;
    totalAlerts: number;
    unacknowledgedAlerts: number;
    alertsBySeverity: Record<string, number>;
    topSuspiciousIdentifiers: Array<{ identifier: string; count: number; types: string[] }>;
    recentTrends: {
      last24Hours: number;
      last7Days: number;
      last30Days: number;
    };
  }> {
    try {
      // Get all suspicious activity keys
      const activityKeys = await redis.keys('suspicious_activity:*');
      const activities: SuspiciousActivity[] = [];

      for (const key of activityKeys) {
        try {
          const data = await redis.get(key);
          if (data) {
            activities.push(JSON.parse(data));
          }
        } catch (error) {
          console.error(`Error parsing activity for ${key}:`, error);
        }
      }

      // Get all alerts
      const alerts = await this.getAlerts(1000); // Get more for statistics

      // Calculate statistics
      const activitiesByType: Record<string, number> = {};
      const activitiesBySeverity: Record<string, number> = {};
      const identifierCounts: Record<string, { count: number; types: Set<string> }> = {};

      activities.forEach(activity => {
        activitiesByType[activity.type] = (activitiesByType[activity.type] || 0) + 1;
        activitiesBySeverity[activity.severity] = (activitiesBySeverity[activity.severity] || 0) + 1;

        if (!identifierCounts[activity.identifier]) {
          identifierCounts[activity.identifier] = { count: 0, types: new Set() };
        }
        identifierCounts[activity.identifier].count++;
        identifierCounts[activity.identifier].types.add(activity.type);
      });

      const alertsBySeverity: Record<string, number> = {};
      let unacknowledgedAlerts = 0;

      alerts.forEach(alert => {
        alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
        if (!alert.acknowledged) {
          unacknowledgedAlerts++;
        }
      });

      const topSuspiciousIdentifiers = Object.entries(identifierCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 20)
        .map(([identifier, data]) => ({
          identifier,
          count: data.count,
          types: Array.from(data.types)
        }));

      // Calculate trends
      const now = Date.now();
      const last24Hours = activities.filter(a =>
        new Date(a.timestamp || 0).getTime() > now - 24 * 60 * 60 * 1000
      ).length;

      const last7Days = activities.filter(a =>
        new Date(a.timestamp || 0).getTime() > now - 7 * 24 * 60 * 60 * 1000
      ).length;

      const last30Days = activities.filter(a =>
        new Date(a.timestamp || 0).getTime() > now - 30 * 24 * 60 * 60 * 1000
      ).length;

      return {
        totalActivities: activities.length,
        activitiesByType,
        activitiesBySeverity,
        totalAlerts: alerts.length,
        unacknowledgedAlerts,
        alertsBySeverity,
        topSuspiciousIdentifiers,
        recentTrends: {
          last24Hours,
          last7Days,
          last30Days
        }
      };

    } catch (error) {
      console.error('Error getting security statistics:', error);
      return {
        totalActivities: 0,
        activitiesByType: {},
        activitiesBySeverity: {},
        totalAlerts: 0,
        unacknowledgedAlerts: 0,
        alertsBySeverity: {},
        topSuspiciousIdentifiers: [],
        recentTrends: {
          last24Hours: 0,
          last7Days: 0,
          last30Days: 0
        }
      };
    }
  }

  // Clean up old activities and alerts
  static async cleanup(retentionDays: number = 30): Promise<void> {
    try {
      const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

      // Clean up old activities
      const activityKeys = await redis.keys('suspicious_activity:*');
      let deletedActivities = 0;

      for (const key of activityKeys) {
        try {
          const data = await redis.get(key);
          if (data) {
            const activity = JSON.parse(data);
            if (new Date(activity.timestamp || 0).getTime() < cutoffTime) {
              await redis.del(key);
              deletedActivities++;
            }
          }
        } catch (error) {
          console.error(`Error cleaning up activity ${key}:`, error);
        }
      }

      // Clean up old alerts
      const alertIds = await redis.zrangebyscore('security_alerts', 0, cutoffTime);
      let deletedAlerts = 0;

      for (const alertId of alertIds) {
        await redis.del(`security_alert:${alertId}`);
        await redis.zrem('security_alerts', alertId);
        deletedAlerts++;
      }

      await AuditService.logSystemEvent('security_cleanup', {
        retentionDays,
        deletedActivities,
        deletedAlerts
      });

    } catch (error) {
      console.error('Error during security cleanup:', error);
      throw error;
    }
  }
}