import { redis } from '@/lib/database';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export class RateLimitService {
  private static readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      skipSuccessfulRequests: true
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 registrations per hour per IP
      skipSuccessfulRequests: false
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      skipSuccessfulRequests: true
    },
    payment: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 payment attempts per hour
      skipSuccessfulRequests: true
    },
    otp: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3, // 3 OTP requests per minute
      skipSuccessfulRequests: false
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 password reset attempts per hour
      skipSuccessfulRequests: false
    }
  };

  // Check if request is allowed under rate limit
  static async checkRateLimit(
    identifier: string,
    action: string,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const config = {
      ...this.DEFAULT_CONFIGS[action],
      ...customConfig
    };

    if (!config) {
      throw new Error(`No rate limit configuration found for action: ${action}`);
    }

    const key = config.keyGenerator 
      ? config.keyGenerator(identifier)
      : `rate_limit:${action}:${identifier}`;

    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Use Redis sorted set to track requests with timestamps
      const pipeline = redis.multi();
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests in window
      pipeline.zcard(key);
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiration
      pipeline.expire(key, Math.ceil(config.windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const currentCount = (results[1][1] as number) || 0;
      const totalHits = currentCount + 1;
      const remaining = Math.max(0, config.maxRequests - totalHits);
      const resetTime = now + config.windowMs;

      return {
        allowed: totalHits <= config.maxRequests,
        remaining,
        resetTime,
        totalHits
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if Redis is unavailable
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
        totalHits: 1
      };
    }
  }

  // Record successful request (for configs that skip successful requests)
  static async recordSuccess(identifier: string, action: string): Promise<void> {
    const config = this.DEFAULT_CONFIGS[action];
    
    if (!config || !config.skipSuccessfulRequests) {
      return;
    }

    const key = `rate_limit:${action}:${identifier}`;
    
    try {
      // Remove the most recent entry to "refund" the successful request
      await redis.zpopmax(key);
    } catch (error) {
      console.error('Error recording successful request:', error);
    }
  }

  // Record failed request (for configs that skip failed requests)
  static async recordFailure(identifier: string, action: string): Promise<void> {
    const config = this.DEFAULT_CONFIGS[action];
    
    if (!config || !config.skipFailedRequests) {
      return;
    }

    const key = `rate_limit:${action}:${identifier}`;
    
    try {
      // Remove the most recent entry to "refund" the failed request
      await redis.zpopmax(key);
    } catch (error) {
      console.error('Error recording failed request:', error);
    }
  }

  // Get current rate limit status without incrementing
  static async getRateLimitStatus(
    identifier: string,
    action: string
  ): Promise<RateLimitResult> {
    const config = this.DEFAULT_CONFIGS[action];
    
    if (!config) {
      throw new Error(`No rate limit configuration found for action: ${action}`);
    }

    const key = `rate_limit:${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Clean up expired entries and count current requests
      await redis.zremrangebyscore(key, 0, windowStart);
      const currentCount = await redis.zcard(key);
      
      const remaining = Math.max(0, config.maxRequests - currentCount);
      const resetTime = now + config.windowMs;

      return {
        allowed: currentCount < config.maxRequests,
        remaining,
        resetTime,
        totalHits: currentCount
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        totalHits: 0
      };
    }
  }

  // Clear rate limit for identifier (admin function)
  static async clearRateLimit(identifier: string, action: string): Promise<void> {
    const key = `rate_limit:${action}:${identifier}`;
    
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Error clearing rate limit:', error);
      throw error;
    }
  }

  // Get all rate limit keys for monitoring
  static async getAllRateLimitKeys(): Promise<string[]> {
    try {
      return await redis.keys('rate_limit:*');
    } catch (error) {
      console.error('Error getting rate limit keys:', error);
      return [];
    }
  }

  // Abuse detection - check for suspicious patterns
  static async detectAbuse(identifier: string): Promise<{
    isAbusive: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      // Check multiple rate limits simultaneously
      const actions = ['login', 'registration', 'api', 'payment', 'otp'];
      const statuses = await Promise.all(
        actions.map(action => this.getRateLimitStatus(identifier, action))
      );

      // Check for high frequency across multiple actions
      const totalRequests = statuses.reduce((sum, status) => sum + status.totalHits, 0);
      if (totalRequests > 200) {
        reasons.push('High frequency requests across multiple endpoints');
        riskScore += 30;
      }

      // Check for failed login attempts
      const loginStatus = statuses[0]; // login is first
      if (loginStatus.totalHits >= 3) {
        reasons.push('Multiple failed login attempts');
        riskScore += 25;
      }

      // Check for rapid registration attempts
      const registrationStatus = statuses[1]; // registration is second
      if (registrationStatus.totalHits >= 2) {
        reasons.push('Multiple registration attempts');
        riskScore += 20;
      }

      // Check for payment abuse
      const paymentStatus = statuses[3]; // payment is fourth
      if (paymentStatus.totalHits >= 5) {
        reasons.push('Multiple payment attempts');
        riskScore += 35;
      }

      // Check for OTP abuse
      const otpStatus = statuses[4]; // otp is fifth
      if (otpStatus.totalHits >= 2) {
        reasons.push('Multiple OTP requests');
        riskScore += 15;
      }

      // Additional pattern detection
      await this.checkSuspiciousPatterns(identifier, reasons, riskScore);

      return {
        isAbusive: riskScore >= 50,
        reasons,
        riskScore
      };
    } catch (error) {
      console.error('Error detecting abuse:', error);
      return {
        isAbusive: false,
        reasons: ['Error during abuse detection'],
        riskScore: 0
      };
    }
  }

  // Check for additional suspicious patterns
  private static async checkSuspiciousPatterns(
    identifier: string,
    reasons: string[],
    riskScore: number
  ): Promise<void> {
    try {
      // Check for rapid sequential requests (potential bot behavior)
      const recentRequestsKey = `recent_requests:${identifier}`;
      const recentRequests = await redis.zrangebyscore(
        recentRequestsKey,
        Date.now() - 10000, // Last 10 seconds
        Date.now()
      );

      if (recentRequests.length > 20) {
        reasons.push('Rapid sequential requests detected');
        riskScore += 20;
      }

      // Check for distributed attacks (same pattern from multiple IPs)
      const patternKey = `pattern:${identifier.split(':')[0]}`; // Extract base pattern
      const similarPatterns = await redis.keys(`rate_limit:*:${patternKey}*`);
      
      if (similarPatterns.length > 10) {
        reasons.push('Distributed attack pattern detected');
        riskScore += 25;
      }

    } catch (error) {
      console.error('Error checking suspicious patterns:', error);
    }
  }

  // Block identifier temporarily
  static async blockIdentifier(
    identifier: string,
    durationMs: number,
    reason: string
  ): Promise<void> {
    const blockKey = `blocked:${identifier}`;
    
    try {
      await redis.setex(
        blockKey,
        Math.ceil(durationMs / 1000),
        JSON.stringify({
          reason,
          blockedAt: Date.now(),
          expiresAt: Date.now() + durationMs
        })
      );
    } catch (error) {
      console.error('Error blocking identifier:', error);
      throw error;
    }
  }

  // Check if identifier is blocked
  static async isBlocked(identifier: string): Promise<{
    blocked: boolean;
    reason?: string;
    expiresAt?: number;
  }> {
    const blockKey = `blocked:${identifier}`;
    
    try {
      const blockData = await redis.get(blockKey);
      
      if (!blockData) {
        return { blocked: false };
      }

      const { reason, expiresAt } = JSON.parse(blockData);
      
      return {
        blocked: true,
        reason,
        expiresAt
      };
    } catch (error) {
      console.error('Error checking if identifier is blocked:', error);
      return { blocked: false };
    }
  }

  // Unblock identifier (admin function)
  static async unblockIdentifier(identifier: string): Promise<void> {
    const blockKey = `blocked:${identifier}`;
    
    try {
      await redis.del(blockKey);
    } catch (error) {
      console.error('Error unblocking identifier:', error);
      throw error;
    }
  }

  // Get comprehensive rate limiting statistics
  static async getStatistics(): Promise<{
    totalActiveRateLimits: number;
    totalBlockedIdentifiers: number;
    topAbusiveIdentifiers: Array<{ identifier: string; score: number; actions: string[] }>;
    rateLimitsByAction: Record<string, number>;
    recentBlocks: Array<{ identifier: string; reason: string; blockedAt: number; expiresAt: number }>;
    averageRequestsPerMinute: number;
    peakRequestsPerMinute: number;
    suspiciousPatterns: Array<{ pattern: string; count: number; severity: 'low' | 'medium' | 'high' }>;
  }> {
    try {
      const rateLimitKeys = await redis.keys('rate_limit:*');
      const blockedKeys = await redis.keys('blocked:*');

      // Analyze rate limit distribution by action
      const rateLimitsByAction: Record<string, number> = {};
      const identifierScores: Record<string, { score: number; actions: Set<string> }> = {};

      for (const key of rateLimitKeys) {
        const parts = key.split(':');
        if (parts.length >= 3) {
          const action = parts[1];
          const identifier = parts.slice(2).join(':');
          
          rateLimitsByAction[action] = (rateLimitsByAction[action] || 0) + 1;
          
          // Calculate abuse score based on request count
          const requestCount = await redis.zcard(key);
          const config = this.DEFAULT_CONFIGS[action];
          
          if (config && requestCount > 0) {
            const utilizationRatio = requestCount / config.maxRequests;
            const score = Math.min(100, utilizationRatio * 50);
            
            if (!identifierScores[identifier]) {
              identifierScores[identifier] = { score: 0, actions: new Set() };
            }
            
            identifierScores[identifier].score += score;
            identifierScores[identifier].actions.add(action);
          }
        }
      }

      // Get top abusive identifiers
      const topAbusiveIdentifiers = Object.entries(identifierScores)
        .map(([identifier, data]) => ({
          identifier,
          score: Math.round(data.score),
          actions: Array.from(data.actions)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      // Get recent blocks with details
      const recentBlocks: Array<{ identifier: string; reason: string; blockedAt: number; expiresAt: number }> = [];
      
      for (const blockKey of blockedKeys.slice(0, 50)) { // Limit to recent 50 blocks
        try {
          const blockData = await redis.get(blockKey);
          if (blockData) {
            const { reason, blockedAt, expiresAt } = JSON.parse(blockData);
            const identifier = blockKey.replace('blocked:', '');
            recentBlocks.push({ identifier, reason, blockedAt, expiresAt });
          }
        } catch (error) {
          console.error(`Error parsing block data for ${blockKey}:`, error);
        }
      }

      // Sort recent blocks by most recent first
      recentBlocks.sort((a, b) => b.blockedAt - a.blockedAt);

      // Calculate request rate metrics
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      const fiveMinutesAgo = now - 300000;
      
      let totalRecentRequests = 0;
      let peakMinuteRequests = 0;
      
      // Sample recent request patterns
      for (const key of rateLimitKeys.slice(0, 100)) { // Sample to avoid performance issues
        try {
          const recentRequests = await redis.zcount(key, oneMinuteAgo, now);
          totalRecentRequests += recentRequests;
          
          // Check peak in 1-minute windows over last 5 minutes
          for (let i = 0; i < 5; i++) {
            const windowStart = now - (i + 1) * 60000;
            const windowEnd = now - i * 60000;
            const windowRequests = await redis.zcount(key, windowStart, windowEnd);
            peakMinuteRequests = Math.max(peakMinuteRequests, windowRequests);
          }
        } catch (error) {
          console.error(`Error calculating metrics for ${key}:`, error);
        }
      }

      const averageRequestsPerMinute = Math.round(totalRecentRequests / Math.min(rateLimitKeys.length, 100));

      // Detect suspicious patterns
      const suspiciousPatterns: Array<{ pattern: string; count: number; severity: 'low' | 'medium' | 'high' }> = [];
      
      // Pattern 1: High concentration of blocks from similar identifiers
      const ipBlocks = recentBlocks.filter(block => block.identifier.includes('ip:'));
      const ipPrefixes: Record<string, number> = {};
      
      ipBlocks.forEach(block => {
        const ip = block.identifier.replace('ip:', '');
        const prefix = ip.split('.').slice(0, 3).join('.'); // /24 subnet
        ipPrefixes[prefix] = (ipPrefixes[prefix] || 0) + 1;
      });
      
      Object.entries(ipPrefixes).forEach(([prefix, count]) => {
        if (count >= 5) {
          suspiciousPatterns.push({
            pattern: `Multiple blocks from subnet ${prefix}.x`,
            count,
            severity: count >= 10 ? 'high' : 'medium'
          });
        }
      });

      // Pattern 2: Rapid sequential blocks
      const recentBlockTimes = recentBlocks.map(b => b.blockedAt).sort((a, b) => b - a);
      let rapidBlockCount = 0;
      
      for (let i = 1; i < Math.min(recentBlockTimes.length, 20); i++) {
        if (recentBlockTimes[i-1] - recentBlockTimes[i] < 10000) { // Within 10 seconds
          rapidBlockCount++;
        }
      }
      
      if (rapidBlockCount >= 5) {
        suspiciousPatterns.push({
          pattern: 'Rapid sequential blocking events',
          count: rapidBlockCount,
          severity: rapidBlockCount >= 10 ? 'high' : 'medium'
        });
      }

      // Pattern 3: High rate limit utilization across multiple actions
      const multiActionAbusers = topAbusiveIdentifiers.filter(abuser => 
        abuser.actions.length >= 3 && abuser.score >= 75
      );
      
      if (multiActionAbusers.length > 0) {
        suspiciousPatterns.push({
          pattern: 'Multi-action rate limit abuse',
          count: multiActionAbusers.length,
          severity: multiActionAbusers.length >= 5 ? 'high' : 'medium'
        });
      }

      return {
        totalActiveRateLimits: rateLimitKeys.length,
        totalBlockedIdentifiers: blockedKeys.length,
        topAbusiveIdentifiers,
        rateLimitsByAction,
        recentBlocks: recentBlocks.slice(0, 20),
        averageRequestsPerMinute,
        peakRequestsPerMinute,
        suspiciousPatterns
      };
    } catch (error) {
      console.error('Error getting rate limiting statistics:', error);
      return {
        totalActiveRateLimits: 0,
        totalBlockedIdentifiers: 0,
        topAbusiveIdentifiers: [],
        rateLimitsByAction: {},
        recentBlocks: [],
        averageRequestsPerMinute: 0,
        peakRequestsPerMinute: 0,
        suspiciousPatterns: []
      };
    }
  }
}