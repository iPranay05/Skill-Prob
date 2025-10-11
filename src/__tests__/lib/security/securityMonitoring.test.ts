import { AuditLoggingService } from '@/lib/security/auditLogging';
import { RateLimitService } from '@/lib/security/rateLimiting';
import { InputValidator } from '@/lib/security/inputValidation';

// Mock dependencies
jest.mock('@/lib/security/auditLogging');
jest.mock('@/lib/security/rateLimiting');
jest.mock('@/lib/database');

const mockAuditLoggingService = AuditLoggingService as jest.Mocked<typeof AuditLoggingService>;
const mockRateLimitService = RateLimitService as jest.Mocked<typeof RateLimitService>;

describe('Security Monitoring Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Comprehensive Security Event Detection', () => {
    it('should detect and log coordinated attack patterns', async () => {
      // Mock multiple failed login attempts from same IP
      mockRateLimitService.detectAbuse.mockResolvedValue({
        isAbusive: true,
        reasons: ['Multiple failed login attempts', 'Rapid sequential requests detected'],
        riskScore: 85
      });

      mockAuditLoggingService.detectSuspiciousActivity.mockResolvedValue({
        suspiciousActivities: [
          {
            type: 'multiple_failed_logins',
            description: '10 failed login attempts in 1 hour',
            severity: 'high',
            count: 10,
            lastOccurrence: new Date()
          },
          {
            type: 'rapid_sequential_actions',
            description: '50 actions in 5 minutes',
            severity: 'medium',
            count: 50,
            lastOccurrence: new Date()
          }
        ],
        riskScore: 75
      });

      // Simulate security monitoring check
      const ipAddress = '192.168.1.100';
      const userId = 'user-123';

      const rateLimitResult = await RateLimitService.detectAbuse(`ip:${ipAddress}`);
      const auditResult = await AuditLoggingService.detectSuspiciousActivity(userId);

      // Verify coordinated attack detection
      expect(rateLimitResult.isAbusive).toBe(true);
      expect(rateLimitResult.riskScore).toBeGreaterThan(80);
      expect(auditResult.riskScore).toBeGreaterThan(70);

      // Verify both systems detected suspicious patterns
      expect(rateLimitResult.reasons).toContain('Multiple failed login attempts');
      expect(auditResult.suspiciousActivities).toHaveLength(2);

      // Verify appropriate logging calls were made
      expect(mockRateLimitService.detectAbuse).toHaveBeenCalledWith(`ip:${ipAddress}`);
      expect(mockAuditLoggingService.detectSuspiciousActivity).toHaveBeenCalledWith(userId);
    });

    it('should correlate security events across different systems', async () => {
      // Mock payment fraud detection
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
        totalHits: 15
      });

      mockAuditLoggingService.logSecurityEvent.mockResolvedValue();

      // Simulate payment fraud scenario
      const userId = 'user-456';
      const ipAddress = '10.0.0.50';

      const paymentRateLimit = await RateLimitService.checkRateLimit(`user:${userId}`, 'payment');

      if (!paymentRateLimit.allowed) {
        await AuditLoggingService.logSecurityEvent({
          type: 'rate_limit_exceeded',
          severity: 'high',
          description: `Payment rate limit exceeded: ${paymentRateLimit.totalHits} attempts`,
          userId,
          ipAddress,
          metadata: {
            action: 'payment',
            totalHits: paymentRateLimit.totalHits,
            resetTime: paymentRateLimit.resetTime
          }
        });
      }

      expect(paymentRateLimit.allowed).toBe(false);
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledWith({
        type: 'rate_limit_exceeded',
        severity: 'high',
        description: expect.stringContaining('Payment rate limit exceeded'),
        userId,
        ipAddress,
        metadata: expect.objectContaining({
          action: 'payment',
          totalHits: 15
        })
      });
    });

    it('should handle cascading security failures', async () => {
      // Mock cascading failures: rate limit -> audit log -> blocking
      mockRateLimitService.detectAbuse.mockResolvedValue({
        isAbusive: true,
        reasons: ['Multiple failed login attempts', 'Payment failures', 'Authorization failures'],
        riskScore: 95
      });

      mockRateLimitService.blockIdentifier.mockResolvedValue();
      mockAuditLoggingService.logSecurityEvent.mockResolvedValue();

      const identifier = 'ip:192.168.1.200';
      const abuseResult = await RateLimitService.detectAbuse(identifier);

      // If high risk score, block the identifier
      if (abuseResult.riskScore >= 90) {
        await RateLimitService.blockIdentifier(identifier, 24 * 60 * 60 * 1000, 'High risk abuse detected');
        
        await AuditLoggingService.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'critical',
          description: `Identifier blocked due to high risk score: ${abuseResult.riskScore}`,
          metadata: {
            riskScore: abuseResult.riskScore,
            reasons: abuseResult.reasons,
            blockedFor: '24 hours'
          }
        });
      }

      expect(abuseResult.riskScore).toBe(95);
      expect(mockRateLimitService.blockIdentifier).toHaveBeenCalledWith(
        identifier,
        24 * 60 * 60 * 1000,
        'High risk abuse detected'
      );
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'suspicious_activity',
          severity: 'critical',
          description: expect.stringContaining('high risk score: 95')
        })
      );
    });
  });

  describe('Input Validation Security Monitoring', () => {
    it('should detect and log XSS attempts', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      mockAuditLoggingService.logSecurityEvent.mockResolvedValue();

      for (const maliciousInput of maliciousInputs) {
        const isCompliant = InputValidator.validateCSPCompliance(maliciousInput);
        
        if (!isCompliant) {
          await AuditLoggingService.logSecurityEvent({
            type: 'suspicious_activity',
            severity: 'high',
            description: 'XSS attempt detected in user input',
            metadata: {
              inputType: 'content_validation',
              maliciousContent: maliciousInput.substring(0, 100), // Truncate for logging
              detectionMethod: 'CSP_validation'
            }
          });
        }

        expect(isCompliant).toBe(false);
      }

      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledTimes(maliciousInputs.length);
    });

    it('should detect SQL injection attempts in query sanitization', async () => {
      const maliciousQueries = [
        { $where: 'this.password == "admin"' },
        { $regex: '.*', username: { $ne: null } },
        { $or: [{ admin: true }, { role: 'admin' }] }
      ];

      mockAuditLoggingService.logSecurityEvent.mockResolvedValue();

      for (const maliciousQuery of maliciousQueries) {
        const originalKeys = Object.keys(maliciousQuery);
        const sanitized = InputValidator.sanitizeMongoQuery(maliciousQuery);
        const sanitizedKeys = Object.keys(sanitized);

        // Check if dangerous operators were removed
        const removedDangerousOperators = originalKeys.filter(key => 
          key.startsWith('$') && !['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin'].includes(key)
        ).filter(key => !sanitizedKeys.includes(key));

        if (removedDangerousOperators.length > 0) {
          await AuditLoggingService.logSecurityEvent({
            type: 'suspicious_activity',
            severity: 'high',
            description: 'NoSQL injection attempt detected',
            metadata: {
              inputType: 'database_query',
              removedOperators: removedDangerousOperators,
              originalQuery: JSON.stringify(maliciousQuery),
              detectionMethod: 'query_sanitization'
            }
          });
        }
      }

      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalled();
    });

    it('should monitor file upload security violations', async () => {
      const maliciousFiles = [
        { name: 'malware.exe', type: 'application/octet-stream', size: 1000 },
        { name: 'script.bat', type: 'application/x-bat', size: 500 },
        { name: 'trojan.scr', type: 'application/x-msdownload', size: 2000 }
      ];

      mockAuditLoggingService.logSecurityEvent.mockResolvedValue();

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5000000; // 5MB

      for (const fileInfo of maliciousFiles) {
        const mockFile = new File(['content'], fileInfo.name, { type: fileInfo.type }) as File & { size: number };
        Object.defineProperty(mockFile, 'size', { value: fileInfo.size });

        const validation = InputValidator.validateFileUpload(mockFile, allowedTypes, maxSize);

        if (!validation.valid) {
          await AuditLoggingService.logSecurityEvent({
            type: 'suspicious_activity',
            severity: 'medium',
            description: 'Malicious file upload attempt detected',
            metadata: {
              fileName: fileInfo.name,
              fileType: fileInfo.type,
              fileSize: fileInfo.size,
              rejectionReason: validation.error,
              detectionMethod: 'file_validation'
            }
          });
        }

        expect(validation.valid).toBe(false);
      }

      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledTimes(maliciousFiles.length);
    });
  });

  describe('Real-time Security Monitoring', () => {
    it('should monitor authentication patterns in real-time', async () => {
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 900000, // 15 minutes
        totalHits: 6
      });

      mockAuditLoggingService.logAuthEvent.mockResolvedValue();
      mockAuditLoggingService.logSecurityEvent.mockResolvedValue();

      // Simulate failed login attempt
      const userId = 'user-789';
      const ipAddress = '172.16.0.100';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

      const loginRateLimit = await RateLimitService.checkRateLimit(`ip:${ipAddress}`, 'login');

      // Log the failed authentication
      await AuditLoggingService.logAuthEvent(
        'login',
        userId,
        'user@example.com',
        false, // Failed login
        ipAddress,
        userAgent,
        'Invalid credentials'
      );

      // If rate limit exceeded, log security event
      if (!loginRateLimit.allowed) {
        await AuditLoggingService.logSecurityEvent({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          description: `Login rate limit exceeded from IP ${ipAddress}`,
          userId,
          ipAddress,
          userAgent,
          metadata: {
            action: 'login',
            totalAttempts: loginRateLimit.totalHits,
            timeWindow: '15 minutes'
          }
        });
      }

      expect(loginRateLimit.allowed).toBe(false);
      expect(mockAuditLoggingService.logAuthEvent).toHaveBeenCalledWith(
        'login',
        userId,
        'user@example.com',
        false,
        ipAddress,
        userAgent,
        'Invalid credentials'
      );
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          userId,
          ipAddress,
          userAgent
        })
      );
    });

    it('should monitor data access patterns for anomalies', async () => {
      mockAuditLoggingService.detectSuspiciousActivity.mockResolvedValue({
        suspiciousActivities: [
          {
            type: 'excessive_data_access',
            description: '200 data access events in 1 hour',
            severity: 'high',
            count: 200,
            lastOccurrence: new Date()
          }
        ],
        riskScore: 80
      });

      mockAuditLoggingService.logSecurityEvent.mockResolvedValue();

      const userId = 'user-999';
      const suspiciousActivity = await AuditLoggingService.detectSuspiciousActivity(userId);

      // Check for data access anomalies
      const dataAccessAnomalies = suspiciousActivity.suspiciousActivities.filter(
        activity => activity.type === 'excessive_data_access'
      );

      if (dataAccessAnomalies.length > 0) {
        for (const anomaly of dataAccessAnomalies) {
          await AuditLoggingService.logSecurityEvent({
            type: 'suspicious_activity',
            severity: anomaly.severity as 'low' | 'medium' | 'high' | 'critical',
            description: `Data access anomaly detected: ${anomaly.description}`,
            userId,
            metadata: {
              anomalyType: anomaly.type,
              eventCount: anomaly.count,
              detectionTime: anomaly.lastOccurrence,
              riskScore: suspiciousActivity.riskScore
            }
          });
        }
      }

      expect(dataAccessAnomalies).toHaveLength(1);
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'suspicious_activity',
          severity: 'high',
          description: expect.stringContaining('Data access anomaly detected'),
          userId,
          metadata: expect.objectContaining({
            anomalyType: 'excessive_data_access',
            eventCount: 200
          })
        })
      );
    });

    it('should monitor payment security in real-time', async () => {
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000, // 1 hour
        totalHits: 11
      });

      mockAuditLoggingService.logPaymentEvent.mockResolvedValue();
      mockAuditLoggingService.logSecurityEvent.mockResolvedValue();

      const userId = 'user-payment-test';
      const ipAddress = '203.0.113.100';

      // Check payment rate limit
      const paymentRateLimit = await RateLimitService.checkRateLimit(`user:${userId}`, 'payment');

      // Log failed payment attempt
      await AuditLoggingService.logPaymentEvent(
        'payment_failed',
        userId,
        99.99,
        'USD',
        'pm_test_card',
        false,
        'Card declined - insufficient funds'
      );

      // If payment rate limit exceeded, trigger security alert
      if (!paymentRateLimit.allowed) {
        await AuditLoggingService.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'high',
          description: 'Potential payment fraud detected - excessive payment attempts',
          userId,
          ipAddress,
          metadata: {
            paymentAttempts: paymentRateLimit.totalHits,
            timeWindow: '1 hour',
            lastAttemptAmount: 99.99,
            currency: 'USD',
            fraudIndicators: ['rate_limit_exceeded', 'multiple_card_declines']
          }
        });
      }

      expect(paymentRateLimit.allowed).toBe(false);
      expect(mockAuditLoggingService.logPaymentEvent).toHaveBeenCalledWith(
        'payment_failed',
        userId,
        99.99,
        'USD',
        'pm_test_card',
        false,
        'Card declined - insufficient funds'
      );
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'suspicious_activity',
          severity: 'high',
          description: expect.stringContaining('payment fraud detected'),
          metadata: expect.objectContaining({
            paymentAttempts: 11,
            fraudIndicators: expect.arrayContaining(['rate_limit_exceeded'])
          })
        })
      );
    });
  });

  describe('Security Metrics and Alerting', () => {
    it('should generate comprehensive security metrics', async () => {
      mockAuditLoggingService.getAuditStatistics.mockResolvedValue({
        totalEvents: 1500,
        successfulEvents: 1200,
        failedEvents: 300,
        criticalEvents: 25,
        eventsByCategory: {
          authentication: 800,
          authorization: 200,
          data_access: 300,
          security: 150,
          payment: 50
        },
        eventsByAction: {
          login: 600,
          logout: 200,
          failed_login: 150,
          payment_attempt: 30,
          suspicious_activity: 25
        },
        topUsers: [
          { userId: 'user-1', eventCount: 50 },
          { userId: 'user-2', eventCount: 45 }
        ]
      });

      mockRateLimitService.getStatistics.mockResolvedValue({
        totalActiveRateLimits: 150,
        totalBlockedIdentifiers: 12,
        topAbusiveIdentifiers: [
          { identifier: 'ip:192.168.1.100', score: 85, actions: ['login', 'payment'] },
          { identifier: 'user:suspicious-user', score: 75, actions: ['api', 'data_access'] }
        ],
        rateLimitsByAction: {
          login: 50,
          api: 60,
          payment: 25,
          registration: 15
        },
        recentBlocks: [
          { identifier: 'ip:10.0.0.1', reason: 'Multiple failed logins', blockedAt: Date.now() - 3600000, expiresAt: Date.now() + 3600000 }
        ],
        averageRequestsPerMinute: 25,
        peakRequestsPerMinute: 150,
        suspiciousPatterns: [
          { pattern: 'Multiple blocks from subnet 192.168.1.x', count: 5, severity: 'high' }
        ]
      });

      const auditStats = await AuditLoggingService.getAuditStatistics('day');
      const rateLimitStats = await RateLimitService.getStatistics();

      // Verify comprehensive metrics collection
      expect(auditStats.totalEvents).toBe(1500);
      expect(auditStats.criticalEvents).toBe(25);
      expect(auditStats.failedEvents).toBe(300);

      expect(rateLimitStats.totalActiveRateLimits).toBe(150);
      expect(rateLimitStats.totalBlockedIdentifiers).toBe(12);
      expect(rateLimitStats.suspiciousPatterns).toHaveLength(1);

      // Verify high-risk indicators
      const securityRiskScore = (auditStats.criticalEvents / auditStats.totalEvents) * 100 +
                               (auditStats.failedEvents / auditStats.totalEvents) * 50 +
                               (rateLimitStats.totalBlockedIdentifiers / rateLimitStats.totalActiveRateLimits) * 30;

      expect(securityRiskScore).toBeGreaterThan(0);

      // Verify top abusive identifiers are tracked
      expect(rateLimitStats.topAbusiveIdentifiers[0].score).toBe(85);
      expect(rateLimitStats.topAbusiveIdentifiers[0].actions).toContain('login');
    });

    it('should trigger appropriate alerts based on security thresholds', async () => {
      mockAuditLoggingService.getAuditStatistics.mockResolvedValue({
        totalEvents: 1000,
        successfulEvents: 600,
        failedEvents: 400, // 40% failure rate - high
        criticalEvents: 50, // 5% critical events - very high
        eventsByCategory: {
          security: 200 // 20% security events - high
        },
        eventsByAction: {},
        topUsers: []
      });

      mockAuditLoggingService.logSecurityEvent.mockResolvedValue();

      const stats = await AuditLoggingService.getAuditStatistics('hour');

      // Calculate security alert thresholds
      const failureRate = (stats.failedEvents / stats.totalEvents) * 100;
      const criticalRate = (stats.criticalEvents / stats.totalEvents) * 100;
      const securityEventRate = ((stats.eventsByCategory.security || 0) / stats.totalEvents) * 100;

      // Trigger alerts based on thresholds
      if (failureRate > 30) {
        await AuditLoggingService.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'critical',
          description: `High failure rate detected: ${failureRate.toFixed(2)}%`,
          metadata: {
            alertType: 'high_failure_rate',
            failureRate,
            threshold: 30,
            timeWindow: 'last_hour'
          }
        });
      }

      if (criticalRate > 3) {
        await AuditLoggingService.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'critical',
          description: `High critical event rate detected: ${criticalRate.toFixed(2)}%`,
          metadata: {
            alertType: 'high_critical_rate',
            criticalRate,
            threshold: 3,
            timeWindow: 'last_hour'
          }
        });
      }

      if (securityEventRate > 15) {
        await AuditLoggingService.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'high',
          description: `High security event rate detected: ${securityEventRate.toFixed(2)}%`,
          metadata: {
            alertType: 'high_security_event_rate',
            securityEventRate,
            threshold: 15,
            timeWindow: 'last_hour'
          }
        });
      }

      expect(failureRate).toBe(40);
      expect(criticalRate).toBe(5);
      expect(securityEventRate).toBe(20);

      // Verify all three alerts were triggered
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledTimes(3);
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'critical',
          description: expect.stringContaining('High failure rate detected: 40.00%')
        })
      );
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle security monitoring failures gracefully', async () => {
      // Mock various failure scenarios
      mockRateLimitService.detectAbuse.mockRejectedValue(new Error('Redis connection failed'));
      mockAuditLoggingService.detectSuspiciousActivity.mockRejectedValue(new Error('Database unavailable'));
      mockAuditLoggingService.logSecurityEvent.mockResolvedValue(); // This should still work

      const identifier = 'ip:192.168.1.1';
      const userId = 'user-123';

      // Security monitoring should continue despite individual component failures
      let rateLimitResult;
      let auditResult;

      try {
        rateLimitResult = await RateLimitService.detectAbuse(identifier);
      } catch (error) {
        // Log the failure but continue monitoring
        await AuditLoggingService.logSecurityEvent({
          type: 'system_error',
          severity: 'medium',
          description: 'Rate limiting service unavailable',
          metadata: {
            component: 'rate_limiting',
            error: (error as Error).message,
            fallbackAction: 'continue_monitoring'
          }
        });
        rateLimitResult = { isAbusive: false, reasons: [], riskScore: 0 };
      }

      try {
        auditResult = await AuditLoggingService.detectSuspiciousActivity(userId);
      } catch (error) {
        // Log the failure but continue monitoring
        await AuditLoggingService.logSecurityEvent({
          type: 'system_error',
          severity: 'medium',
          description: 'Audit logging service unavailable',
          metadata: {
            component: 'audit_logging',
            error: (error as Error).message,
            fallbackAction: 'continue_monitoring'
          }
        });
        auditResult = { suspiciousActivities: [], riskScore: 0 };
      }

      expect(rateLimitResult.riskScore).toBe(0);
      expect(auditResult.riskScore).toBe(0);
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system_error',
          description: 'Rate limiting service unavailable'
        })
      );
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system_error',
          description: 'Audit logging service unavailable'
        })
      );
    });

    it('should maintain security monitoring during partial system failures', async () => {
      // Mock partial failure scenario - rate limiting works, audit logging fails
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 900000,
        totalHits: 8
      });

      mockAuditLoggingService.logAuthEvent.mockRejectedValue(new Error('Audit database connection failed'));
      mockAuditLoggingService.logSecurityEvent.mockResolvedValue(); // Fallback logging works

      const userId = 'user-456';
      const ipAddress = '10.0.0.1';

      // Check rate limit (this works)
      const rateLimitResult = await RateLimitService.checkRateLimit(`ip:${ipAddress}`, 'login');

      // Try to log auth event (this fails)
      try {
        await AuditLoggingService.logAuthEvent('login', userId, 'user@example.com', false, ipAddress);
      } catch (error) {
        // Use fallback logging
        await AuditLoggingService.logSecurityEvent({
          type: 'system_error',
          severity: 'medium',
          description: 'Failed to log authentication event - using fallback',
          userId,
          ipAddress,
          metadata: {
            originalAction: 'login',
            originalSuccess: false,
            fallbackReason: (error as Error).message,
            rateLimitStatus: rateLimitResult
          }
        });
      }

      expect(rateLimitResult.allowed).toBe(false);
      expect(mockAuditLoggingService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system_error',
          description: expect.stringContaining('Failed to log authentication event'),
          metadata: expect.objectContaining({
            originalAction: 'login',
            rateLimitStatus: rateLimitResult
          })
        })
      );
    });
  });
});