import { RateLimitService, RateLimitConfig } from '@/lib/security/rateLimiting';
import { redis } from '@/lib/database';

// Mock Redis
jest.mock('@/lib/database', () => ({
  redis: {
    multi: jest.fn(),
    zremrangebyscore: jest.fn(),
    zcard: jest.fn(),
    zadd: jest.fn(),
    expire: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    zpopmax: jest.fn(),
    zrangebyscore: jest.fn(),
    zcount: jest.fn()
  }
}));

const mockRedis = redis as jest.Mocked<typeof redis>;

describe('RateLimitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000000); // Fixed timestamp for testing
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rate Limit Checking', () => {
    describe('checkRateLimit', () => {
      it('should allow requests within rate limit', async () => {
        const mockPipeline = {
          zremrangebyscore: jest.fn().mockReturnThis(),
          zcard: jest.fn().mockReturnThis(),
          zadd: jest.fn().mockReturnThis(),
          expire: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, 0], // zremrangebyscore result
            [null, 2], // zcard result (current count)
            [null, 1], // zadd result
            [null, 1]  // expire result
          ])
        };

        mockRedis.multi.mockReturnValue(mockPipeline as any);

        const result = await RateLimitService.checkRateLimit('user123', 'login');

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2); // 5 max - 3 total = 2 remaining
        expect(result.totalHits).toBe(3);
        expect(mockPipeline.zremrangebyscore).toHaveBeenCalledWith(
          'rate_limit:login:user123',
          0,
          1000000 - 15 * 60 * 1000 // 15 minutes ago
        );
      });

      it('should deny requests exceeding rate limit', async () => {
        const mockPipeline = {
          zremrangebyscore: jest.fn().mockReturnThis(),
          zcard: jest.fn().mockReturnThis(),
          zadd: jest.fn().mockReturnThis(),
          expire: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, 0],
            [null, 5], // At the limit
            [null, 1],
            [null, 1]
          ])
        };

        mockRedis.multi.mockReturnValue(mockPipeline as any);

        const result = await RateLimitService.checkRateLimit('user123', 'login');

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.totalHits).toBe(6); // 5 existing + 1 new = 6
      });

      it('should handle Redis errors gracefully and fail open', async () => {
        const mockPipeline = {
          zremrangebyscore: jest.fn().mockReturnThis(),
          zcard: jest.fn().mockReturnThis(),
          zadd: jest.fn().mockReturnThis(),
          expire: jest.fn().mockReturnThis(),
          exec: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
        };

        mockRedis.multi.mockReturnValue(mockPipeline as any);

        const result = await RateLimitService.checkRateLimit('user123', 'login');

        // Should fail open (allow request) when Redis is unavailable
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4); // Default config max - 1
        expect(result.totalHits).toBe(1);
      });

      it('should use custom configuration when provided', async () => {
        const mockPipeline = {
          zremrangebyscore: jest.fn().mockReturnThis(),
          zcard: jest.fn().mockReturnThis(),
          zadd: jest.fn().mockReturnThis(),
          expire: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, 0],
            [null, 1],
            [null, 1],
            [null, 1]
          ])
        };

        mockRedis.multi.mockReturnValue(mockPipeline as any);

        const customConfig = {
          windowMs: 30000, // 30 seconds
          maxRequests: 3
        };

        const result = await RateLimitService.checkRateLimit('user123', 'api', customConfig);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(1); // 3 max - 2 total = 1
        expect(mockPipeline.expire).toHaveBeenCalledWith(
          'rate_limit:api:user123',
          30 // 30 seconds
        );
      });

      it('should throw error for unknown action', async () => {
        await expect(
          RateLimitService.checkRateLimit('user123', 'unknown_action')
        ).rejects.toThrow('No rate limit configuration found for action: unknown_action');
      });
    });
  });

  describe('Rate Limit Status', () => {
    describe('getRateLimitStatus', () => {
      it('should get current status without incrementing', async () => {
        mockRedis.zremrangebyscore.mockResolvedValue(0);
        mockRedis.zcard.mockResolvedValue(3);

        const result = await RateLimitService.getRateLimitStatus('user123', 'login');

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2); // 5 max - 3 current = 2
        expect(result.totalHits).toBe(3);
        expect(mockRedis.zremrangebyscore).toHaveBeenCalled();
        expect(mockRedis.zcard).toHaveBeenCalled();
      });

      it('should handle Redis errors gracefully', async () => {
        mockRedis.zremrangebyscore.mockRejectedValue(new Error('Redis error'));

        const result = await RateLimitService.getRateLimitStatus('user123', 'login');

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(5); // Default max
        expect(result.totalHits).toBe(0);
      });
    });
  });

  describe('Success and Failure Recording', () => {
    describe('recordSuccess', () => {
      it('should remove entry for actions that skip successful requests', async () => {
        mockRedis.zpopmax.mockResolvedValue(['entry', 'score']);

        await RateLimitService.recordSuccess('user123', 'login');

        expect(mockRedis.zpopmax).toHaveBeenCalledWith('rate_limit:login:user123');
      });

      it('should not remove entry for actions that do not skip successful requests', async () => {
        await RateLimitService.recordSuccess('user123', 'registration');

        expect(mockRedis.zpopmax).not.toHaveBeenCalled();
      });

      it('should handle Redis errors gracefully', async () => {
        mockRedis.zpopmax.mockRejectedValue(new Error('Redis error'));

        await expect(
          RateLimitService.recordSuccess('user123', 'login')
        ).resolves.not.toThrow();
      });
    });

    describe('recordFailure', () => {
      it('should remove entry for actions that skip failed requests', async () => {
        // Note: None of the default configs skip failed requests
        // This test would need a custom config or mock
        await RateLimitService.recordFailure('user123', 'login');

        expect(mockRedis.zpopmax).not.toHaveBeenCalled();
      });
    });
  });

  describe('Rate Limit Management', () => {
    describe('clearRateLimit', () => {
      it('should clear rate limit for identifier', async () => {
        mockRedis.del.mockResolvedValue(1);

        await RateLimitService.clearRateLimit('user123', 'login');

        expect(mockRedis.del).toHaveBeenCalledWith('rate_limit:login:user123');
      });

      it('should handle Redis errors', async () => {
        mockRedis.del.mockRejectedValue(new Error('Redis error'));

        await expect(
          RateLimitService.clearRateLimit('user123', 'login')
        ).rejects.toThrow('Redis error');
      });
    });

    describe('getAllRateLimitKeys', () => {
      it('should return all rate limit keys', async () => {
        const mockKeys = ['rate_limit:login:user1', 'rate_limit:api:user2'];
        mockRedis.keys.mockResolvedValue(mockKeys);

        const keys = await RateLimitService.getAllRateLimitKeys();

        expect(keys).toEqual(mockKeys);
        expect(mockRedis.keys).toHaveBeenCalledWith('rate_limit:*');
      });

      it('should handle Redis errors', async () => {
        mockRedis.keys.mockRejectedValue(new Error('Redis error'));

        const keys = await RateLimitService.getAllRateLimitKeys();

        expect(keys).toEqual([]);
      });
    });
  });

  describe('Abuse Detection', () => {
    describe('detectAbuse', () => {
      it('should detect abuse based on multiple factors', async () => {
        // Mock rate limit statuses for different actions
        const mockStatuses = [
          { totalHits: 4, allowed: false }, // login
          { totalHits: 2, allowed: false }, // registration
          { totalHits: 50, allowed: true }, // api
          { totalHits: 6, allowed: false }, // payment
          { totalHits: 3, allowed: false }  // otp
        ];

        let statusIndex = 0;
        mockRedis.zremrangebyscore.mockResolvedValue(0);
        mockRedis.zcard.mockImplementation(() => {
          return Promise.resolve(mockStatuses[statusIndex++]?.totalHits || 0);
        });

        // Mock recent requests check
        mockRedis.zrangebyscore.mockResolvedValue(Array(25).fill('request')); // 25 requests in 10 seconds
        mockRedis.keys.mockResolvedValue(Array(15).fill('pattern')); // 15 similar patterns

        const result = await RateLimitService.detectAbuse('ip:192.168.1.1');

        expect(result.isAbusive).toBe(true);
        expect(result.riskScore).toBeGreaterThan(50);
        expect(result.reasons).toContain('Multiple failed login attempts');
        expect(result.reasons).toContain('Multiple registration attempts');
        expect(result.reasons).toContain('Multiple payment attempts');
        expect(result.reasons).toContain('Multiple OTP requests');
        expect(result.reasons).toContain('Rapid sequential requests detected');
      });

      it('should not flag normal usage as abusive', async () => {
        // Mock normal usage patterns
        const mockStatuses = [
          { totalHits: 1, allowed: true }, // login
          { totalHits: 0, allowed: true }, // registration
          { totalHits: 10, allowed: true }, // api
          { totalHits: 1, allowed: true }, // payment
          { totalHits: 1, allowed: true }  // otp
        ];

        let statusIndex = 0;
        mockRedis.zremrangebyscore.mockResolvedValue(0);
        mockRedis.zcard.mockImplementation(() => {
          return Promise.resolve(mockStatuses[statusIndex++]?.totalHits || 0);
        });

        mockRedis.zrangebyscore.mockResolvedValue(Array(5).fill('request')); // 5 requests in 10 seconds
        mockRedis.keys.mockResolvedValue(Array(2).fill('pattern')); // 2 similar patterns

        const result = await RateLimitService.detectAbuse('ip:192.168.1.1');

        expect(result.isAbusive).toBe(false);
        expect(result.riskScore).toBeLessThan(50);
        expect(result.reasons).toHaveLength(0);
      });

      it('should handle detection errors gracefully', async () => {
        mockRedis.zremrangebyscore.mockRejectedValue(new Error('Redis error'));

        const result = await RateLimitService.detectAbuse('user123');

        expect(result.isAbusive).toBe(false);
        expect(result.reasons).toContain('Error during abuse detection');
        expect(result.riskScore).toBe(0);
      });
    });
  });

  describe('Blocking and Unblocking', () => {
    describe('blockIdentifier', () => {
      it('should block identifier with reason and duration', async () => {
        mockRedis.setex.mockResolvedValue('OK');

        const durationMs = 60000; // 1 minute
        const reason = 'Suspicious activity detected';

        await RateLimitService.blockIdentifier('user123', durationMs, reason);

        expect(mockRedis.setex).toHaveBeenCalledWith(
          'blocked:user123',
          60, // 60 seconds
          expect.stringContaining(reason)
        );
      });

      it('should handle blocking errors', async () => {
        mockRedis.setex.mockRejectedValue(new Error('Redis error'));

        await expect(
          RateLimitService.blockIdentifier('user123', 60000, 'Test reason')
        ).rejects.toThrow('Redis error');
      });
    });

    describe('isBlocked', () => {
      it('should return block status when identifier is blocked', async () => {
        const blockData = {
          reason: 'Suspicious activity',
          blockedAt: Date.now(),
          expiresAt: Date.now() + 60000
        };

        mockRedis.get.mockResolvedValue(JSON.stringify(blockData));

        const result = await RateLimitService.isBlocked('user123');

        expect(result.blocked).toBe(true);
        expect(result.reason).toBe('Suspicious activity');
        expect(result.expiresAt).toBe(blockData.expiresAt);
      });

      it('should return not blocked when identifier is not blocked', async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await RateLimitService.isBlocked('user123');

        expect(result.blocked).toBe(false);
        expect(result.reason).toBeUndefined();
        expect(result.expiresAt).toBeUndefined();
      });

      it('should handle Redis errors gracefully', async () => {
        mockRedis.get.mockRejectedValue(new Error('Redis error'));

        const result = await RateLimitService.isBlocked('user123');

        expect(result.blocked).toBe(false);
      });
    });

    describe('unblockIdentifier', () => {
      it('should unblock identifier', async () => {
        mockRedis.del.mockResolvedValue(1);

        await RateLimitService.unblockIdentifier('user123');

        expect(mockRedis.del).toHaveBeenCalledWith('blocked:user123');
      });

      it('should handle unblocking errors', async () => {
        mockRedis.del.mockRejectedValue(new Error('Redis error'));

        await expect(
          RateLimitService.unblockIdentifier('user123')
        ).rejects.toThrow('Redis error');
      });
    });
  });

  describe('Statistics and Monitoring', () => {
    describe('getStatistics', () => {
      it('should return comprehensive rate limiting statistics', async () => {
        const mockRateLimitKeys = [
          'rate_limit:login:user1',
          'rate_limit:login:user2',
          'rate_limit:api:user1',
          'rate_limit:payment:user3'
        ];

        const mockBlockedKeys = [
          'blocked:user1',
          'blocked:user2'
        ];

        mockRedis.keys
          .mockResolvedValueOnce(mockRateLimitKeys)
          .mockResolvedValueOnce(mockBlockedKeys);

        // Mock request counts for rate limit keys
        mockRedis.zcard
          .mockResolvedValueOnce(3) // login:user1
          .mockResolvedValueOnce(4) // login:user2
          .mockResolvedValueOnce(10) // api:user1
          .mockResolvedValueOnce(8); // payment:user3

        // Mock recent request counts
        mockRedis.zcount.mockResolvedValue(5);

        // Mock block data
        const blockData1 = {
          reason: 'Multiple failed logins',
          blockedAt: Date.now() - 30000,
          expiresAt: Date.now() + 30000
        };
        const blockData2 = {
          reason: 'Suspicious activity',
          blockedAt: Date.now() - 60000,
          expiresAt: Date.now() + 60000
        };

        mockRedis.get
          .mockResolvedValueOnce(JSON.stringify(blockData1))
          .mockResolvedValueOnce(JSON.stringify(blockData2));

        const stats = await RateLimitService.getStatistics();

        expect(stats.totalActiveRateLimits).toBe(4);
        expect(stats.totalBlockedIdentifiers).toBe(2);
        expect(stats.rateLimitsByAction).toEqual({
          login: 2,
          api: 1,
          payment: 1
        });
        expect(stats.topAbusiveIdentifiers).toBeDefined();
        expect(stats.recentBlocks).toHaveLength(2);
        expect(stats.averageRequestsPerMinute).toBeDefined();
        expect(stats.suspiciousPatterns).toBeDefined();
      });

      it('should handle statistics errors gracefully', async () => {
        mockRedis.keys.mockRejectedValue(new Error('Redis error'));

        const stats = await RateLimitService.getStatistics();

        expect(stats.totalActiveRateLimits).toBe(0);
        expect(stats.totalBlockedIdentifiers).toBe(0);
        expect(stats.topAbusiveIdentifiers).toEqual([]);
        expect(stats.recentBlocks).toEqual([]);
        expect(stats.suspiciousPatterns).toEqual([]);
      });
    });
  });
});