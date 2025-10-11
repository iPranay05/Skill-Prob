import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware, SecurityPresets } from '@/lib/security/middleware';
import { RateLimitService } from '@/lib/security/rateLimiting';
import { AuditService } from '@/lib/security/auditService';
import { SuspiciousActivityMonitor } from '@/lib/security/suspiciousActivityMonitor';
import { DDoSProtectionService } from '@/lib/security/ddosProtection';
import { ErrorHandler } from '@/lib/errors';

// GET /api/security/status - Get security system status and metrics
export async function GET(request: NextRequest) {
  return SecurityMiddleware.apply(
    request,
    SecurityPresets.ADMIN_API,
    async (req, context) => {
      try {
        // Check if user has admin privileges
        if (!context.userRole || !['admin', 'super_admin'].includes(context.userRole)) {
          return ErrorHandler.unauthorized('Admin access required');
        }

        // Get comprehensive security metrics
        const [
          rateLimitStats,
          auditStats,
          securityStats,
          ddosMetrics
        ] = await Promise.all([
          RateLimitService.getStatistics(),
          AuditService.getStatistics(),
          SuspiciousActivityMonitor.getSecurityStatistics(),
          DDoSProtectionService.getMetrics()
        ]);

        // Get recent security events
        const [
          recentActivities,
          recentAlerts,
          recentAuditLogs
        ] = await Promise.all([
          SuspiciousActivityMonitor.getRecentActivities(20),
          SuspiciousActivityMonitor.getAlerts(20, false), // Unacknowledged alerts
          AuditService.queryLogs({
            category: 'security',
            limit: 20,
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          })
        ]);

        // Calculate overall security health score
        const healthScore = calculateSecurityHealthScore({
          rateLimitStats,
          auditStats,
          securityStats,
          ddosMetrics
        });

        const response = {
          status: 'operational',
          healthScore,
          timestamp: new Date().toISOString(),
          metrics: {
            rateLimiting: {
              totalActiveRateLimits: rateLimitStats.totalActiveRateLimits,
              totalBlockedIdentifiers: rateLimitStats.totalBlockedIdentifiers,
              topAbusiveIdentifiers: rateLimitStats.topAbusiveIdentifiers.slice(0, 10),
              averageRequestsPerMinute: rateLimitStats.averageRequestsPerMinute,
              peakRequestsPerMinute: rateLimitStats.peakRequestsPerMinute
            },
            audit: {
              totalLogs: auditStats.totalLogs,
              successfulOperations: auditStats.successfulOperations,
              failedOperations: auditStats.failedOperations,
              criticalEvents: auditStats.criticalEvents,
              securityEvents: auditStats.securityEvents,
              authenticationFailures: auditStats.authenticationFailures
            },
            suspiciousActivity: {
              totalActivities: securityStats.totalActivities,
              totalAlerts: securityStats.totalAlerts,
              unacknowledgedAlerts: securityStats.unacknowledgedAlerts,
              recentTrends: securityStats.recentTrends
            },
            ddosProtection: {
              totalRequests: ddosMetrics.totalRequests,
              blockedRequests: ddosMetrics.blockedRequests,
              uniqueIPs: ddosMetrics.uniqueIPs,
              attacksDetected: ddosMetrics.attacksDetected,
              currentlyBlocked: ddosMetrics.currentlyBlocked,
              averageRequestsPerSecond: ddosMetrics.averageRequestsPerSecond,
              peakRequestsPerSecond: ddosMetrics.peakRequestsPerSecond
            }
          },
          recentEvents: {
            suspiciousActivities: recentActivities.slice(0, 10),
            securityAlerts: recentAlerts.slice(0, 10),
            auditLogs: recentAuditLogs.logs.slice(0, 10)
          },
          systemHealth: {
            rateLimitingHealth: rateLimitStats.totalActiveRateLimits < 1000 ? 'healthy' : 'warning',
            auditingHealth: auditStats.criticalEvents < 10 ? 'healthy' : 'critical',
            ddosProtectionHealth: ddosMetrics.attacksDetected < 5 ? 'healthy' : 'warning',
            overallHealth: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical'
          }
        };

        return ErrorHandler.success(response, 'Security status retrieved successfully');

      } catch (error) {
        console.error('Security status error:', error);
        return ErrorHandler.handle(error);
      }
    }
  );
}

// POST /api/security/status - Perform security system maintenance
export async function POST(request: NextRequest) {
  return SecurityMiddleware.apply(
    request,
    SecurityPresets.ADMIN_API,
    async (req, context) => {
      try {
        // Check if user has super admin privileges
        if (!context.userRole || context.userRole !== 'super_admin') {
          return ErrorHandler.unauthorized('Super admin access required');
        }

        const body = await request.json();
        const { action, parameters = {} } = body;

        let result: any = {};

        switch (action) {
          case 'cleanup':
            // Perform system cleanup
            const [auditCleanup, securityCleanup] = await Promise.all([
              AuditService.cleanupOldLogs(parameters.retentionDays || 365),
              SuspiciousActivityMonitor.cleanup(parameters.retentionDays || 30),
              DDoSProtectionService.cleanup()
            ]);
            
            result = {
              auditLogsDeleted: auditCleanup,
              securityDataCleaned: true,
              ddosDataCleaned: true
            };
            break;

          case 'clear_rate_limits':
            // Clear rate limits for specific identifier
            if (parameters.identifier && parameters.action) {
              await RateLimitService.clearRateLimit(parameters.identifier, parameters.action);
              result = { cleared: true, identifier: parameters.identifier, action: parameters.action };
            } else {
              return ErrorHandler.badRequest('Missing identifier or action parameter');
            }
            break;

          case 'unblock_ip':
            // Unblock IP address
            if (parameters.ipAddress) {
              await Promise.all([
                RateLimitService.unblockIdentifier(`ip:${parameters.ipAddress}`),
                DDoSProtectionService.unblockIP(parameters.ipAddress)
              ]);
              result = { unblocked: true, ipAddress: parameters.ipAddress };
            } else {
              return ErrorHandler.badRequest('Missing ipAddress parameter');
            }
            break;

          case 'acknowledge_alert':
            // Acknowledge security alert
            if (parameters.alertId) {
              await SuspiciousActivityMonitor.acknowledgeAlert(
                parameters.alertId,
                context.userId || 'system'
              );
              result = { acknowledged: true, alertId: parameters.alertId };
            } else {
              return ErrorHandler.badRequest('Missing alertId parameter');
            }
            break;

          default:
            return ErrorHandler.badRequest(`Unknown action: ${action}`);
        }

        // Log the maintenance action
        await AuditService.logSystemEvent('security_maintenance', {
          action,
          parameters,
          result,
          performedBy: context.userId,
          performedByEmail: context.userEmail
        }, 'medium');

        return ErrorHandler.success(result, `Security maintenance action '${action}' completed successfully`);

      } catch (error) {
        console.error('Security maintenance error:', error);
        return ErrorHandler.handle(error);
      }
    }
  );
}

// Calculate overall security health score
function calculateSecurityHealthScore(metrics: {
  rateLimitStats: any;
  auditStats: any;
  securityStats: any;
  ddosMetrics: any;
}): number {
  let score = 100;

  // Deduct points for high rate limit usage
  if (metrics.rateLimitStats.totalActiveRateLimits > 500) {
    score -= 10;
  }
  if (metrics.rateLimitStats.totalBlockedIdentifiers > 100) {
    score -= 15;
  }

  // Deduct points for security events
  if (metrics.auditStats.criticalEvents > 5) {
    score -= 20;
  }
  if (metrics.auditStats.authenticationFailures > 50) {
    score -= 10;
  }

  // Deduct points for suspicious activities
  if (metrics.securityStats.unacknowledgedAlerts > 10) {
    score -= 15;
  }
  if (metrics.securityStats.recentTrends.last24Hours > 100) {
    score -= 10;
  }

  // Deduct points for DDoS attacks
  if (metrics.ddosMetrics.attacksDetected > 0) {
    score -= 25;
  }
  if (metrics.ddosMetrics.currentlyBlocked > 50) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}