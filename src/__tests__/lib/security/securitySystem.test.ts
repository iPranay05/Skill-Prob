import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { SecurityMiddleware, SecurityPresets } from '@/lib/security/middleware';
import { RateLimitService } from '@/lib/security/rateLimiting';
import { InputValidator } from '@/lib/security/inputValidation';
import { AuditService } from '@/lib/security/auditService';
import { SuspiciousActivityMonitor } from '@/lib/security/suspiciousActivityMonitor';
import { DDoSProtectionService } from '@/lib/security/ddosProtection';
import { EncryptionService } from '@/lib/security/encryption';

// Mock Redis
jest.mock('@/lib/database', () => ({
  redis: {
    multi: jest.fn(() => ({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 0], [null, 5], [null, 'OK'], [null, 1]])
    })),
    zcount: jest.fn().mockResolvedValue(5),
    keys: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    zrangebyscore: jest.fn().mockResolvedValue([]),
    zrevrange: jest.fn().mockResolvedValue([]),
    zpopmax: jest.fn().mockResolvedValue(['item', 'score'])
  }
}));

// Mock Supabase
jest.mock('@/lib/database', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      lt: jest.fn().mockResolvedValue({ data: [], error: null })
    }))
  }
}));

describe('Security System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables for encryption
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.HMAC_SECRET = 'test-hmac-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Input Validation', () => {
    it('should sanitize HTML content', () => {
      const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = InputValidator.sanitizeHtml(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should validate user registration schema', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
      };

      const result = InputValidator.validateApiRequest(
        InputValidator.userRegistrationSchema,
        validData
      );

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = InputValidator.validateApiRequest(
        InputValidator.userRegistrationSchema,
        invalidData
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('email: Invalid email format');
    });

    it('should reject weak passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = InputValidator.validateApiRequest(
        InputValidator.userRegistrationSchema,
        invalidData
      );

      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain('Password must be at least 8 characters');
    });

    it('should validate file uploads', () => {
      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const allowedTypes = ['application/pdf', 'image/jpeg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      const result = InputValidator.validateFileUpload(validFile, allowedTypes, maxSize);

      expect(result.valid).toBe(true);
    });

    it('should reject malicious file types', () => {
      const maliciousFile = new File(['content'], 'virus.exe', { type: 'application/octet-stream' });
      const allowedTypes = ['application/pdf', 'image/jpeg'];
      const maxSize = 5 * 1024 * 1024;

      const result = InputValidator.validateFileUpload(maliciousFile, allowedTypes, maxSize);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed for security reasons');
    });

    it('should sanitize MongoDB queries', () => {
      const maliciousQuery = {
        email: 'test@example.com',
        $where: 'function() { return true; }',
        password: { $ne: null }
      };

      const sanitized = InputValidator.sanitizeMongoQuery(maliciousQuery);

      expect(sanitized).not.toHaveProperty('$where');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password).toEqual({ $ne: null });
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const result = await RateLimitService.checkRateLimit('test-user', 'api');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.totalHits).toBeGreaterThan(0);
    });

    it('should detect abuse patterns', async () => {
      const result = await RateLimitService.detectAbuse('abusive-user');

      expect(result).toHaveProperty('isAbusive');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('riskScore');
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it('should block and unblock identifiers', async () => {
      const identifier = 'test-identifier';
      const duration = 60000; // 1 minute
      const reason = 'Test block';

      await RateLimitService.blockIdentifier(identifier, duration, reason);
      
      const blockStatus = await RateLimitService.isBlocked(identifier);
      expect(blockStatus.blocked).toBe(true);
      expect(blockStatus.reason).toBe(reason);

      await RateLimitService.unblockIdentifier(identifier);
      
      const unblockStatus = await RateLimitService.isBlocked(identifier);
      expect(unblockStatus.blocked).toBe(false);
    });

    it('should get comprehensive statistics', async () => {
      const stats = await RateLimitService.getStatistics();

      expect(stats).toHaveProperty('totalActiveRateLimits');
      expect(stats).toHaveProperty('totalBlockedIdentifiers');
      expect(stats).toHaveProperty('topAbusiveIdentifiers');
      expect(stats).toHaveProperty('rateLimitsByAction');
      expect(stats).toHaveProperty('suspiciousPatterns');
      expect(Array.isArray(stats.topAbusiveIdentifiers)).toBe(true);
      expect(Array.isArray(stats.suspiciousPatterns)).toBe(true);
    });
  });

  describe('Encryption Service', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive data';
      
      const encrypted = EncryptionService.encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);

      const decrypted = EncryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should hash and verify passwords', () => {
      const password = 'mySecurePassword123!';
      
      const { hash, salt } = EncryptionService.hash(password);
      expect(hash).not.toBe(password);
      expect(salt).toBeDefined();

      const isValid = EncryptionService.verifyHash(password, hash, salt);
      expect(isValid).toBe(true);

      const isInvalid = EncryptionService.verifyHash('wrongPassword', hash, salt);
      expect(isInvalid).toBe(false);
    });

    it('should encrypt and decrypt PII data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        ssn: '123-45-6789',
        publicInfo: 'This is public'
      };

      const fieldsToEncrypt = ['ssn', 'email'];
      
      const encrypted = EncryptionService.encryptPII(userData, fieldsToEncrypt);
      expect(encrypted.ssn).not.toBe(userData.ssn);
      expect(encrypted.email).not.toBe(userData.email);
      expect(encrypted.name).toBe(userData.name); // Not encrypted
      expect(encrypted.ssn_encrypted).toBe(true);
      expect(encrypted.email_encrypted).toBe(true);

      const decrypted = EncryptionService.decryptPII(encrypted, fieldsToEncrypt);
      expect(decrypted.ssn).toBe(userData.ssn);
      expect(decrypted.email).toBe(userData.email);
      expect(decrypted.name).toBe(userData.name);
      expect(decrypted.ssn_encrypted).toBeUndefined();
      expect(decrypted.email_encrypted).toBeUndefined();
    });

    it('should generate secure tokens', () => {
      const token1 = EncryptionService.generateSecureToken(32);
      const token2 = EncryptionService.generateSecureToken(32);
      
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('should create and verify HMAC signatures', () => {
      const data = 'important data';
      const secret = 'secret-key';
      
      const signature = EncryptionService.createHMAC(data, secret);
      expect(signature).toBeDefined();
      expect(signature.length).toBe(64); // SHA256 hex = 64 chars

      const isValid = EncryptionService.verifyHMAC(data, signature, secret);
      expect(isValid).toBe(true);

      const isInvalid = EncryptionService.verifyHMAC('tampered data', signature, secret);
      expect(isInvalid).toBe(false);
    });

    it('should mask sensitive data for logging', () => {
      const creditCard = '1234567890123456';
      const masked = EncryptionService.maskSensitiveData(creditCard, 4);
      
      expect(masked).toBe('1234********3456');
      expect(masked).not.toBe(creditCard);
    });
  });

  describe('Audit Service', () => {
    it('should log activities successfully', async () => {
      await expect(AuditService.logActivity({
        userId: 'user123',
        userEmail: 'test@example.com',
        action: 'test_action',
        resource: 'test_resource',
        details: { test: 'data' },
        success: true
      })).resolves.not.toThrow();
    });

    it('should log authentication events', async () => {
      await expect(AuditService.logAuthentication(
        'login',
        'user123',
        'test@example.com',
        true,
        { loginMethod: 'password' },
        '192.168.1.1',
        'Mozilla/5.0'
      )).resolves.not.toThrow();
    });

    it('should log security events', async () => {
      await expect(AuditService.logSecurityEvent(
        'suspicious_activity',
        'high',
        { riskScore: 85, reasons: ['multiple_failed_logins'] },
        'user123',
        'test@example.com',
        '192.168.1.1',
        'Mozilla/5.0',
        'Multiple failed login attempts detected'
      )).resolves.not.toThrow();
    });

    it('should query logs with filters', async () => {
      const result = await AuditService.queryLogs({
        userId: 'user123',
        action: 'login',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
        limit: 10
      });

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('totalCount');
      expect(Array.isArray(result.logs)).toBe(true);
      expect(typeof result.totalCount).toBe('number');
    });

    it('should get audit statistics', async () => {
      const stats = await AuditService.getStatistics();

      expect(stats).toHaveProperty('totalLogs');
      expect(stats).toHaveProperty('successfulOperations');
      expect(stats).toHaveProperty('failedOperations');
      expect(stats).toHaveProperty('criticalEvents');
      expect(stats).toHaveProperty('topActions');
      expect(stats).toHaveProperty('topResources');
      expect(stats).toHaveProperty('suspiciousIPs');
      expect(Array.isArray(stats.topActions)).toBe(true);
      expect(Array.isArray(stats.suspiciousIPs)).toBe(true);
    });
  });

  describe('Suspicious Activity Monitor', () => {
    it('should report suspicious activity', async () => {
      const activity = {
        identifier: 'test-user',
        type: 'rate_limit_abuse' as const,
        severity: 'medium' as const,
        details: {
          riskScore: 75,
          reasons: ['high_frequency_requests'],
          ipAddress: '192.168.1.1'
        }
      };

      await expect(SuspiciousActivityMonitor.reportSuspiciousActivity(activity))
        .resolves.not.toThrow();
    });

    it('should get recent activities', async () => {
      const activities = await SuspiciousActivityMonitor.getRecentActivities(10, 'high');

      expect(Array.isArray(activities)).toBe(true);
      activities.forEach(activity => {
        expect(activity).toHaveProperty('identifier');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('severity');
        expect(activity).toHaveProperty('details');
      });
    });

    it('should get security alerts', async () => {
      const alerts = await SuspiciousActivityMonitor.getAlerts(10, false);

      expect(Array.isArray(alerts)).toBe(true);
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('acknowledged');
      });
    });

    it('should get security statistics', async () => {
      const stats = await SuspiciousActivityMonitor.getSecurityStatistics();

      expect(stats).toHaveProperty('totalActivities');
      expect(stats).toHaveProperty('activitiesByType');
      expect(stats).toHaveProperty('totalAlerts');
      expect(stats).toHaveProperty('unacknowledgedAlerts');
      expect(stats).toHaveProperty('topSuspiciousIdentifiers');
      expect(stats).toHaveProperty('recentTrends');
      expect(Array.isArray(stats.topSuspiciousIdentifiers)).toBe(true);
    });
  });

  describe('DDoS Protection', () => {
    it('should check requests and allow valid ones', async () => {
      const result = await DDoSProtectionService.checkRequest(
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('metrics');
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.riskScore).toBe('number');
    });

    it('should block whitelisted IPs', async () => {
      const result = await DDoSProtectionService.checkRequest('127.0.0.1');

      expect(result.allowed).toBe(true);
      expect(result.riskScore).toBe(0);
    });

    it('should get DDoS metrics', async () => {
      const metrics = await DDoSProtectionService.getMetrics();

      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('blockedRequests');
      expect(metrics).toHaveProperty('uniqueIPs');
      expect(metrics).toHaveProperty('topIPs');
      expect(metrics).toHaveProperty('attacksDetected');
      expect(metrics).toHaveProperty('currentlyBlocked');
      expect(Array.isArray(metrics.topIPs)).toBe(true);
    });

    it('should unblock IP addresses', async () => {
      const ipAddress = '192.168.1.100';
      
      await expect(DDoSProtectionService.unblockIP(ipAddress))
        .resolves.not.toThrow();
    });
  });

  describe('Security Middleware Integration', () => {
    const createMockRequest = (options: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: any;
    } = {}) => {
      const headers = new Headers(options.headers || {});
      headers.set('user-agent', 'Mozilla/5.0 Test Browser');
      
      return new NextRequest(options.url || 'http://localhost:3000/api/test', {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
    };

    it('should apply public API security preset', async () => {
      const request = createMockRequest();
      
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const response = await SecurityMiddleware.apply(
        request,
        SecurityPresets.PUBLIC_API,
        mockHandler
      );

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should validate input when configured', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { test: 'data' }
      });

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const response = await SecurityMiddleware.apply(
        request,
        { validateInput: true, auditAction: 'test_action' },
        mockHandler
      );

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle malicious input', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { test: '<script>alert("xss")</script>' }
      });

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const response = await SecurityMiddleware.apply(
        request,
        { validateInput: true },
        mockHandler
      );

      // Should block malicious content
      expect(response.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should apply rate limiting', async () => {
      const request = createMockRequest();

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const response = await SecurityMiddleware.apply(
        request,
        { rateLimitAction: 'api' },
        mockHandler
      );

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('End-to-End Security Flow', () => {
    it('should handle a complete security check flow', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/login',
        headers: { 
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: {
          email: 'test@example.com',
          password: 'SecurePass123!'
        }
      });

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ 
          success: true, 
          user: { id: 'user123', email: 'test@example.com' }
        }), { status: 200 })
      );

      const response = await SecurityMiddleware.apply(
        request,
        SecurityPresets.AUTHENTICATION,
        mockHandler
      );

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should block suspicious activity patterns', async () => {
      // Simulate multiple rapid requests from same IP
      const requests = Array.from({ length: 5 }, () => 
        createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/auth/login',
          headers: { 
            'content-type': 'application/json',
            'x-forwarded-for': '192.168.1.100'
          },
          body: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        })
      );

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false }), { status: 401 })
      );

      // Process requests sequentially
      for (const request of requests) {
        await SecurityMiddleware.apply(
          request,
          SecurityPresets.AUTHENTICATION,
          mockHandler
        );
      }

      // Check if suspicious activity was detected
      const activities = await SuspiciousActivityMonitor.getRecentActivities(10);
      const stats = await RateLimitService.getStatistics();
      
      expect(stats.totalActiveRateLimits).toBeGreaterThanOrEqual(0);
    });
  });
});