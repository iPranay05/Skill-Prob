import { AuditLoggingService, AuditLogEntry, SecurityEvent } from '@/lib/security/auditLogging';
import { supabaseAdmin } from '@/lib/database';

// Mock Supabase
jest.mock('@/lib/database', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      })),
      delete: jest.fn(() => ({
        lt: jest.fn(() => ({ data: [], error: null }))
      }))
    }))
  }
}));

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('AuditLoggingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Audit Log Entry Creation', () => {
    describe('logAuditEntry', () => {
      it('should successfully log audit entry with all fields', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        const entry: AuditLogEntry = {
          userId: 'user-123',
          userEmail: 'test@example.com',
          userRole: 'student',
          action: 'login',
          resource: 'authentication',
          resourceId: 'session-456',
          details: { loginMethod: 'email' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-789',
          success: true,
          severity: 'low',
          category: 'authentication'
        };

        await AuditLoggingService.logAuditEntry(entry);

        expect(mockFrom).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            user_id: 'user-123',
            user_email: 'test@example.com',
            user_role: 'student',
            action: 'login',
            resource: 'authentication',
            resource_id: 'session-456',
            details: { loginMethod: 'email' },
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            session_id: 'session-789',
            success: true,
            severity: 'low',
            category: 'authentication',
            created_at: expect.any(String)
          })
        ]);
      });

      it('should handle database errors gracefully', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ 
          error: { message: 'Database connection failed' } 
        });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        const entry: AuditLogEntry = {
          action: 'test_action',
          resource: 'test_resource'
        };

        // Should not throw error
        await expect(AuditLoggingService.logAuditEntry(entry)).resolves.not.toThrow();
        
        expect(console.error).toHaveBeenCalledWith(
          'Failed to insert audit log:',
          { message: 'Database connection failed' }
        );
      });

      it('should use default values for optional fields', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        const minimalEntry: AuditLogEntry = {
          action: 'test_action',
          resource: 'test_resource'
        };

        await AuditLoggingService.logAuditEntry(minimalEntry);

        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            user_id: null,
            user_email: null,
            user_role: null,
            action: 'test_action',
            resource: 'test_resource',
            resource_id: null,
            details: {},
            ip_address: null,
            user_agent: null,
            session_id: null,
            success: true, // Default to true
            error_message: null,
            severity: 'low', // Default severity
            category: 'system' // Default category
          })
        ]);
      });
    });
  });

  describe('Authentication Event Logging', () => {
    describe('logAuthEvent', () => {
      it('should log successful authentication events', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        await AuditLoggingService.logAuthEvent(
          'login',
          'user-123',
          'test@example.com',
          true,
          '192.168.1.1',
          'Mozilla/5.0',
          undefined,
          { loginMethod: 'email' }
        );

        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            user_id: 'user-123',
            user_email: 'test@example.com',
            action: 'login',
            resource: 'authentication',
            success: true,
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            severity: 'low',
            category: 'authentication',
            details: expect.objectContaining({
              loginMethod: 'email',
              timestamp: expect.any(String)
            })
          })
        ]);
      });

      it('should log failed authentication events with higher severity', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        await AuditLoggingService.logAuthEvent(
          'login',
          undefined,
          'test@example.com',
          false,
          '192.168.1.1',
          'Mozilla/5.0',
          'Invalid credentials'
        );

        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            user_id: undefined,
            user_email: 'test@example.com',
            action: 'login',
            resource: 'authentication',
            success: false,
            error_message: 'Invalid credentials',
            severity: 'medium', // Failed auth should be medium severity
            category: 'authentication'
          })
        ]);
      });
    });
  });

  describe('Security Event Logging', () => {
    describe('logSecurityEvent', () => {
      it('should log security events and trigger alerts for critical events', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        const criticalEvent: SecurityEvent = {
          type: 'suspicious_activity',
          severity: 'critical',
          description: 'Multiple failed login attempts detected',
          userId: 'user-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: { attemptCount: 10 }
        };

        await AuditLoggingService.logSecurityEvent(criticalEvent);

        // Should log the security event
        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            user_id: 'user-123',
            action: 'suspicious_activity',
            resource: 'security',
            success: false,
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            error_message: 'Multiple failed login attempts detected',
            severity: 'critical',
            category: 'security',
            details: expect.objectContaining({
              eventType: 'suspicious_activity',
              description: 'Multiple failed login attempts detected',
              metadata: { attemptCount: 10 }
            })
          })
        ]);

        // Should also log the alert trigger
        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            action: 'security_alert_triggered',
            resource: 'security_system',
            success: true,
            severity: 'critical',
            category: 'security'
          })
        ]);

        expect(console.warn).toHaveBeenCalledWith(
          'CRITICAL SECURITY EVENT:',
          expect.objectContaining({
            type: 'suspicious_activity',
            description: 'Multiple failed login attempts detected',
            userId: 'user-123',
            ipAddress: '192.168.1.1'
          })
        );
      });

      it('should not trigger alerts for non-critical events', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        const lowSeverityEvent: SecurityEvent = {
          type: 'rate_limit_exceeded',
          severity: 'medium',
          description: 'Rate limit exceeded',
          userId: 'user-123'
        };

        await AuditLoggingService.logSecurityEvent(lowSeverityEvent);

        // Should only be called once (for the security event, not the alert)
        expect(mockInsert).toHaveBeenCalledTimes(1);
        expect(console.warn).not.toHaveBeenCalled();
      });
    });
  });

  describe('Payment Event Logging', () => {
    describe('logPaymentEvent', () => {
      it('should log successful payment events', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        await AuditLoggingService.logPaymentEvent(
          'payment_success',
          'user-123',
          99.99,
          'USD',
          'pm_123',
          true,
          undefined,
          { courseId: 'course-456' }
        );

        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            user_id: 'user-123',
            action: 'payment_success',
            resource: 'payment',
            success: true,
            severity: 'low',
            category: 'data_modification',
            details: expect.objectContaining({
              amount: 99.99,
              currency: 'USD',
              paymentMethodId: 'pm_123',
              courseId: 'course-456'
            })
          })
        ]);
      });

      it('should log failed payment events with higher severity', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        await AuditLoggingService.logPaymentEvent(
          'payment_failed',
          'user-123',
          99.99,
          'USD',
          'pm_123',
          false,
          'Card declined'
        );

        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            user_id: 'user-123',
            action: 'payment_failed',
            resource: 'payment',
            success: false,
            error_message: 'Card declined',
            severity: 'medium',
            category: 'data_modification'
          })
        ]);
      });
    });
  });

  describe('Admin Action Logging', () => {
    describe('logAdminAction', () => {
      it('should log admin actions with high severity', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabaseAdmin.from = mockFrom;

        await AuditLoggingService.logAdminAction(
          'user_role_change',
          'user',
          'user-456',
          'admin-123',
          'super_admin',
          'user-456',
          true,
          { oldRole: 'student', newRole: 'mentor' }
        );

        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            user_id: 'admin-123',
            user_role: 'super_admin',
            action: 'admin_user_role_change',
            resource: 'user',
            resource_id: 'user-456',
            success: true,
            severity: 'high', // Admin actions are always high severity
            category: 'authorization',
            details: expect.objectContaining({
              targetUserId: 'user-456',
              adminAction: 'user_role_change',
              oldRole: 'student',
              newRole: 'mentor'
            })
          })
        ]);
      });
    });
  });

  describe('Audit Log Querying', () => {
    describe('queryAuditLogs', () => {
      it('should query audit logs with filters', async () => {
        const mockData = [
          { id: '1', action: 'login', user_id: 'user-123' },
          { id: '2', action: 'logout', user_id: 'user-123' }
        ];

        const mockQuery = {
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis()
        };

        const mockSelect = jest.fn().mockReturnValue(mockQuery);
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        mockSupabaseAdmin.from = mockFrom;

        // Mock the final query execution
        Object.assign(mockQuery, { 
          then: jest.fn().mockResolvedValue({ data: mockData, error: null, count: 2 })
        });

        const filters = {
          userId: 'user-123',
          action: 'login',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          limit: 10,
          offset: 0
        };

        const result = await AuditLoggingService.queryAuditLogs(filters);

        expect(mockFrom).toHaveBeenCalledWith('audit_logs');
        expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
        expect(mockQuery.eq).toHaveBeenCalledWith('action', 'login');
        expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2023-01-01T00:00:00.000Z');
        expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2023-12-31T00:00:00.000Z');
        expect(mockQuery.limit).toHaveBeenCalledWith(10);
        expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      });

      it('should handle query errors gracefully', async () => {
        const mockQuery = {
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          then: jest.fn().mockRejectedValue(new Error('Database error'))
        };

        const mockSelect = jest.fn().mockReturnValue(mockQuery);
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        mockSupabaseAdmin.from = mockFrom;

        await expect(AuditLoggingService.queryAuditLogs({})).rejects.toThrow('Database error');
        expect(console.error).toHaveBeenCalledWith('Error querying audit logs:', expect.any(Error));
      });
    });
  });

  describe('Suspicious Activity Detection', () => {
    describe('detectSuspiciousActivity', () => {
      it('should detect multiple failed login attempts', async () => {
        const mockFailedLogins = Array(6).fill(null).map((_, i) => ({
          id: `failed-${i}`,
          action: 'login',
          success: false,
          created_at: new Date().toISOString()
        }));

        const mockQuery = {
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: mockFailedLogins, error: null })
        };

        const mockSelect = jest.fn().mockReturnValue(mockQuery);
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        mockSupabaseAdmin.from = mockFrom;

        const result = await AuditLoggingService.detectSuspiciousActivity('user-123');

        expect(result.suspiciousActivities).toContainEqual(
          expect.objectContaining({
            type: 'multiple_failed_logins',
            description: '6 failed login attempts in 24 hours',
            severity: 'high',
            count: 6
          })
        );
        expect(result.riskScore).toBeGreaterThanOrEqual(30);
      });

      it('should detect excessive data access', async () => {
        const mockAccessLogs = Array(150).fill(null).map((_, i) => ({
          id: `access-${i}`,
          category: 'data_access',
          created_at: new Date().toISOString()
        }));

        const mockQuery = {
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          then: jest.fn()
            .mockResolvedValueOnce({ data: [], error: null }) // Failed logins
            .mockResolvedValueOnce({ data: mockAccessLogs, error: null }) // Access logs
            .mockResolvedValue({ data: [], error: null }) // Other queries
        };

        const mockSelect = jest.fn().mockReturnValue(mockQuery);
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        mockSupabaseAdmin.from = mockFrom;

        const result = await AuditLoggingService.detectSuspiciousActivity('user-123');

        expect(result.suspiciousActivities).toContainEqual(
          expect.objectContaining({
            type: 'excessive_data_access',
            description: '150 data access events in 24 hours',
            severity: 'medium',
            count: 150
          })
        );
        expect(result.riskScore).toBeGreaterThanOrEqual(20);
      });

      it('should handle detection errors gracefully', async () => {
        const mockQuery = {
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          then: jest.fn().mockRejectedValue(new Error('Database error'))
        };

        const mockSelect = jest.fn().mockReturnValue(mockQuery);
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        mockSupabaseAdmin.from = mockFrom;

        const result = await AuditLoggingService.detectSuspiciousActivity('user-123');

        expect(result.suspiciousActivities).toEqual([]);
        expect(result.riskScore).toBe(0);
        expect(console.error).toHaveBeenCalledWith('Error detecting suspicious activity:', expect.any(Error));
      });
    });
  });

  describe('Audit Statistics', () => {
    describe('getAuditStatistics', () => {
      it('should calculate audit statistics correctly', async () => {
        const mockLogs = [
          { success: true, severity: 'low', category: 'authentication', action: 'login', user_id: 'user-1' },
          { success: false, severity: 'high', category: 'security', action: 'failed_login', user_id: 'user-1' },
          { success: true, severity: 'critical', category: 'payment', action: 'payment', user_id: 'user-2' },
          { success: true, severity: 'medium', category: 'authentication', action: 'logout', user_id: 'user-1' }
        ];

        const mockQuery = {
          gte: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: mockLogs, error: null })
        };

        const mockSelect = jest.fn().mockReturnValue(mockQuery);
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        mockSupabaseAdmin.from = mockFrom;

        const result = await AuditLoggingService.getAuditStatistics('day');

        expect(result.totalEvents).toBe(4);
        expect(result.successfulEvents).toBe(3);
        expect(result.failedEvents).toBe(1);
        expect(result.criticalEvents).toBe(1);
        expect(result.eventsByCategory).toEqual({
          authentication: 2,
          security: 1,
          payment: 1
        });
        expect(result.eventsByAction).toEqual({
          login: 1,
          failed_login: 1,
          payment: 1,
          logout: 1
        });
        expect(result.topUsers).toContainEqual({ userId: 'user-1', eventCount: 3 });
      });

      it('should handle different timeframes', async () => {
        const mockQuery = {
          gte: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: [], error: null })
        };

        const mockSelect = jest.fn().mockReturnValue(mockQuery);
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        mockSupabaseAdmin.from = mockFrom;

        const timeframes = ['hour', 'day', 'week', 'month'] as const;
        
        for (const timeframe of timeframes) {
          await AuditLoggingService.getAuditStatistics(timeframe);
          expect(mockQuery.gte).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Log Cleanup', () => {
    describe('cleanupOldLogs', () => {
      it('should delete old logs and return count', async () => {
        const mockDeletedLogs = [{ id: '1' }, { id: '2' }];
        
        const mockDelete = {
          lt: jest.fn().mockResolvedValue({ data: mockDeletedLogs, error: null })
        };

        const mockFrom = jest.fn()
          .mockReturnValueOnce({ delete: jest.fn().mockReturnValue(mockDelete) }) // For deletion
          .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) }); // For logging cleanup

        mockSupabaseAdmin.from = mockFrom;

        const deletedCount = await AuditLoggingService.cleanupOldLogs(90);

        expect(deletedCount).toBe(2);
        expect(mockDelete.lt).toHaveBeenCalledWith(
          'created_at',
          expect.any(String) // Should be a date 90 days ago
        );
      });

      it('should handle cleanup errors', async () => {
        const mockDelete = {
          lt: jest.fn().mockRejectedValue(new Error('Cleanup failed'))
        };

        const mockFrom = jest.fn().mockReturnValue({ 
          delete: jest.fn().mockReturnValue(mockDelete) 
        });
        mockSupabaseAdmin.from = mockFrom;

        await expect(AuditLoggingService.cleanupOldLogs(90)).rejects.toThrow('Cleanup failed');
        expect(console.error).toHaveBeenCalledWith('Error cleaning up old audit logs:', expect.any(Error));
      });
    });
  });

  describe('Fallback Logging', () => {
    it('should use fallback logging when database fails', async () => {
      const mockInsert = jest.fn().mockRejectedValue(new Error('Database unavailable'));
      const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
      mockSupabaseAdmin.from = mockFrom;

      const entry: AuditLogEntry = {
        action: 'test_action',
        resource: 'test_resource'
      };

      await AuditLoggingService.logAuditEntry(entry);

      expect(console.error).toHaveBeenCalledWith('Audit logging error:', expect.any(Error));
      expect(console.error).toHaveBeenCalledWith(
        'FALLBACK AUDIT LOG:',
        expect.stringContaining('Database unavailable')
      );
    });
  });
});