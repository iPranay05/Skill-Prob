import { redis } from '@/lib/database';
import { AuditService } from './auditService';
import { SuspiciousActivityMonitor } from './suspiciousActivityMonitor';

export interface DDoSConfig {
  enabled: boolean;
  globalRateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  ipRateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  distributedAttackDetection: {
    enabled: boolean;
    minIPs: number;
    timeWindow: number;
    threshold: number;
  };
  autoBlock: {
    enabled: boolean;
    blockDuration: number;
    riskThreshold: number;
  };
  whitelist: string[];
  blacklist: string[];
}

export interface DDoSMetrics {
  totalRequests: number;
  blockedRequests: number;
  uniqueIPs: number;
  topIPs: Array<{ ip: string; requests: number; blocked: boolean }>;
  attacksDetected: number;
  currentlyBlocked: number;
  averageRequestsPerSecond: number;
  peakRequestsPerSecond: number;
}

export interface AttackPattern {
  type: 'volumetric' | 'distributed' | 'slowloris' | 'application_layer';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIPs: string[];
  requestCount: number;
  timeWindow: number;
  detectedAt: Date;
  mitigated: boolean;
}

export class DDoSProtectionService {
  private static readonly DEFAULT_CONFIG: DDoSConfig = {
    enabled: true,
    globalRateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000 // 10k requests per minute globally
    },
    ipRateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100 // 100 requests per minute per IP
    },
    distributedAttackDetection: {
      enabled: true,
      minIPs: 10, // Minimum IPs to consider distributed attack
      timeWindow: 5 * 60 * 1000, // 5 minutes
      threshold: 1000 // Total requests threshold
    },
    autoBlock: {
      enabled: true,
      blockDuration: 60 * 60 * 1000, // 1 hour
      riskThreshold: 80 // Risk score threshold for auto-block
    },
    whitelist: [
      '127.0.0.1',
      '::1',
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16'
    ],
    blacklist: []
  };

  // Check if request should be allowed
  static async checkRequest(
    ipAddress: string,
    userAgent?: string,
    config: Partial<DDoSConfig> = {}
  ): Promise<{
    allowed: boolean;
    reason?: string;
    riskScore: number;
    metrics: {
      globalRequests: number;
      ipRequests: number;
      remainingQuota: number;
    };
  }> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    if (!fullConfig.enabled) {
      return {
        allowed: true,
        riskScore: 0,
        metrics: { globalRequests: 0, ipRequests: 0, remainingQuota: 100 }
      };
    }

    try {
      // Check whitelist
      if (this.isWhitelisted(ipAddress, fullConfig.whitelist)) {
        return {
          allowed: true,
          riskScore: 0,
          metrics: { globalRequests: 0, ipRequests: 0, remainingQuota: 100 }
        };
      }

      // Check blacklist
      if (this.isBlacklisted(ipAddress, fullConfig.blacklist)) {
        await this.recordBlockedRequest(ipAddress, 'blacklisted', userAgent);
        return {
          allowed: false,
          reason: 'IP address is blacklisted',
          riskScore: 100,
          metrics: { globalRequests: 0, ipRequests: 0, remainingQuota: 0 }
        };
      }

      // Check if IP is currently blocked
      const blockStatus = await this.isIPBlocked(ipAddress);
      if (blockStatus.blocked) {
        await this.recordBlockedRequest(ipAddress, 'auto_blocked', userAgent);
        return {
          allowed: false,
          reason: `IP blocked: ${blockStatus.reason}`,
          riskScore: 100,
          metrics: { globalRequests: 0, ipRequests: 0, remainingQuota: 0 }
        };
      }

      // Check global rate limit
      const globalRequests = await this.getGlobalRequestCount(fullConfig.globalRateLimit.windowMs);
      if (globalRequests >= fullConfig.globalRateLimit.maxRequests) {
        await this.recordBlockedRequest(ipAddress, 'global_rate_limit', userAgent);
        return {
          allowed: false,
          reason: 'Global rate limit exceeded',
          riskScore: 70,
          metrics: {
            globalRequests,
            ipRequests: 0,
            remainingQuota: 0
          }
        };
      }

      // Check IP-specific rate limit
      const ipRequests = await this.getIPRequestCount(ipAddress, fullConfig.ipRateLimit.windowMs);
      if (ipRequests >= fullConfig.ipRateLimit.maxRequests) {
        await this.recordBlockedRequest(ipAddress, 'ip_rate_limit', userAgent);
        
        // Calculate risk score based on how much the limit was exceeded
        const excessRatio = ipRequests / fullConfig.ipRateLimit.maxRequests;
        const riskScore = Math.min(100, 50 + (excessRatio - 1) * 30);
        
        return {
          allowed: false,
          reason: 'IP rate limit exceeded',
          riskScore,
          metrics: {
            globalRequests,
            ipRequests,
            remainingQuota: 0
          }
        };
      }

      // Record the request
      await this.recordRequest(ipAddress, userAgent);

      // Calculate risk score
      const riskScore = await this.calculateRiskScore(ipAddress, userAgent, fullConfig);

      // Auto-block if risk score is too high
      if (fullConfig.autoBlock.enabled && riskScore >= fullConfig.autoBlock.riskThreshold) {
        await this.blockIP(
          ipAddress,
          fullConfig.autoBlock.blockDuration,
          `Auto-blocked due to high risk score: ${riskScore}`
        );
        
        await this.recordBlockedRequest(ipAddress, 'auto_blocked_risk', userAgent);
        
        return {
          allowed: false,
          reason: `Auto-blocked due to suspicious activity (risk score: ${riskScore})`,
          riskScore,
          metrics: {
            globalRequests,
            ipRequests,
            remainingQuota: 0
          }
        };
      }

      // Check for distributed attack patterns
      if (fullConfig.distributedAttackDetection.enabled) {
        await this.checkDistributedAttack(fullConfig);
      }

      const remainingQuota = Math.max(0, fullConfig.ipRateLimit.maxRequests - ipRequests - 1);

      return {
        allowed: true,
        riskScore,
        metrics: {
          globalRequests,
          ipRequests: ipRequests + 1,
          remainingQuota
        }
      };

    } catch (error) {
      console.error('DDoS protection check error:', error);
      // Fail open - allow request if there's an error
      return {
        allowed: true,
        riskScore: 0,
        metrics: { globalRequests: 0, ipRequests: 0, remainingQuota: 100 }
      };
    }
  }

  // Record a request
  private static async recordRequest(ipAddress: string, userAgent?: string): Promise<void> {
    const now = Date.now();
    const pipeline = redis.multi();

    // Global request counter
    pipeline.zadd('ddos:global_requests', now, `${now}-${Math.random()}`);
    pipeline.expire('ddos:global_requests', 3600); // 1 hour

    // IP-specific request counter
    pipeline.zadd(`ddos:ip_requests:${ipAddress}`, now, `${now}-${Math.random()}`);
    pipeline.expire(`ddos:ip_requests:${ipAddress}`, 3600); // 1 hour

    // User agent tracking for bot detection
    if (userAgent) {
      pipeline.zadd(`ddos:user_agents:${ipAddress}`, now, userAgent);
      pipeline.expire(`ddos:user_agents:${ipAddress}`, 3600); // 1 hour
    }

    // Request pattern tracking
    pipeline.zadd('ddos:request_patterns', now, ipAddress);
    pipeline.expire('ddos:request_patterns', 1800); // 30 minutes

    await pipeline.exec();
  }

  // Record a blocked request
  private static async recordBlockedRequest(
    ipAddress: string,
    reason: string,
    userAgent?: string
  ): Promise<void> {
    const now = Date.now();
    const pipeline = redis.multi();

    // Blocked requests counter
    pipeline.zadd('ddos:blocked_requests', now, `${ipAddress}:${reason}`);
    pipeline.expire('ddos:blocked_requests', 3600); // 1 hour

    // IP-specific blocked counter
    pipeline.zadd(`ddos:blocked:${ipAddress}`, now, reason);
    pipeline.expire(`ddos:blocked:${ipAddress}`, 3600); // 1 hour

    await pipeline.exec();

    // Log to audit trail
    await AuditService.logSecurityEvent(
      'ddos_request_blocked',
      'medium',
      {
        ipAddress,
        reason,
        userAgent,
        timestamp: new Date(now).toISOString()
      },
      undefined,
      undefined,
      ipAddress,
      userAgent
    );
  }

  // Get global request count
  private static async getGlobalRequestCount(windowMs: number): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      // Clean up old entries
      await redis.zremrangebyscore('ddos:global_requests', 0, windowStart);
      
      // Count current requests
      return await redis.zcard('ddos:global_requests');
    } catch (error) {
      console.error('Error getting global request count:', error);
      return 0;
    }
  }

  // Get IP-specific request count
  private static async getIPRequestCount(ipAddress: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const key = `ddos:ip_requests:${ipAddress}`;
    
    try {
      // Clean up old entries
      await redis.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests
      return await redis.zcard(key);
    } catch (error) {
      console.error('Error getting IP request count:', error);
      return 0;
    }
  }

  // Calculate risk score for an IP
  private static async calculateRiskScore(
    ipAddress: string,
    userAgent?: string,
    config: DDoSConfig = this.DEFAULT_CONFIG
  ): Promise<number> {
    let riskScore = 0;

    try {
      // Factor 1: Request frequency (30% weight)
      const recentRequests = await this.getIPRequestCount(ipAddress, 60 * 1000); // Last minute
      const frequencyRatio = recentRequests / (config.ipRateLimit.maxRequests / 60); // Normalize to per-minute
      riskScore += Math.min(30, frequencyRatio * 30);

      // Factor 2: User agent analysis (20% weight)
      if (userAgent) {
        const userAgentRisk = this.analyzeUserAgent(userAgent);
        riskScore += userAgentRisk * 0.2 * 100;
      }

      // Factor 3: Request pattern consistency (25% weight)
      const patternRisk = await this.analyzeRequestPattern(ipAddress);
      riskScore += patternRisk * 25;

      // Factor 4: Historical behavior (25% weight)
      const historicalRisk = await this.analyzeHistoricalBehavior(ipAddress);
      riskScore += historicalRisk * 25;

      return Math.min(100, Math.max(0, riskScore));
    } catch (error) {
      console.error('Error calculating risk score:', error);
      return 0;
    }
  }

  // Analyze user agent for bot indicators
  private static analyzeUserAgent(userAgent: string): number {
    const botIndicators = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
      /okhttp/i
    ];

    const suspiciousPatterns = [
      /^$/,  // Empty user agent
      /^Mozilla\/5\.0$/,  // Minimal user agent
      /test/i,
      /scanner/i,
      /exploit/i
    ];

    // Check for bot indicators
    if (botIndicators.some(pattern => pattern.test(userAgent))) {
      return 0.8; // High risk for known bots
    }

    // Check for suspicious patterns
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return 0.6; // Medium-high risk for suspicious patterns
    }

    // Check for very old or very new browser versions (potential spoofing)
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
      const version = parseInt(chromeMatch[1]);
      if (version < 70 || version > 120) { // Adjust based on current versions
        return 0.4; // Medium risk for unusual versions
      }
    }

    return 0.1; // Low risk for normal user agents
  }

  // Analyze request pattern for consistency
  private static async analyzeRequestPattern(ipAddress: string): Promise<number> {
    try {
      const key = `ddos:ip_requests:${ipAddress}`;
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      // Get request timestamps from last 5 minutes
      const requests = await redis.zrangebyscore(key, fiveMinutesAgo, now);
      
      if (requests.length < 10) {
        return 0; // Not enough data
      }

      // Extract timestamps
      const timestamps = requests.map(req => {
        const timestamp = req.split('-')[0];
        return parseInt(timestamp);
      }).sort((a, b) => a - b);

      // Calculate intervals between requests
      const intervals: number[] = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }

      // Check for too-regular patterns (bot behavior)
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      
      // Low variance indicates regular, bot-like behavior
      const coefficientOfVariation = stdDev / avgInterval;
      
      if (coefficientOfVariation < 0.1) {
        return 0.9; // Very regular pattern - likely bot
      } else if (coefficientOfVariation < 0.3) {
        return 0.6; // Somewhat regular pattern
      } else if (coefficientOfVariation > 2.0) {
        return 0.4; // Very irregular pattern - might be burst attack
      }

      return 0.1; // Normal human-like pattern
    } catch (error) {
      console.error('Error analyzing request pattern:', error);
      return 0;
    }
  }

  // Analyze historical behavior
  private static async analyzeHistoricalBehavior(ipAddress: string): Promise<number> {
    try {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      
      // Check if IP has been blocked before
      const blockHistory = await redis.zrangebyscore(`ddos:blocked:${ipAddress}`, oneDayAgo, now);
      if (blockHistory.length > 0) {
        return 0.8; // High risk for previously blocked IPs
      }

      // Check request volume over last 24 hours
      const dailyRequests = await redis.zcount(`ddos:ip_requests:${ipAddress}`, oneDayAgo, now);
      if (dailyRequests > 10000) {
        return 0.7; // High volume over 24 hours
      } else if (dailyRequests > 5000) {
        return 0.5; // Medium volume
      } else if (dailyRequests > 1000) {
        return 0.3; // Moderate volume
      }

      return 0.1; // Low historical risk
    } catch (error) {
      console.error('Error analyzing historical behavior:', error);
      return 0;
    }
  }

  // Check for distributed attack patterns
  private static async checkDistributedAttack(config: DDoSConfig): Promise<void> {
    try {
      const now = Date.now();
      const windowStart = now - config.distributedAttackDetection.timeWindow;
      
      // Get unique IPs making requests in the time window
      const requestPatterns = await redis.zrangebyscore('ddos:request_patterns', windowStart, now);
      const uniqueIPs = new Set(requestPatterns);
      
      // Count total requests
      const totalRequests = await redis.zcount('ddos:global_requests', windowStart, now);
      
      if (uniqueIPs.size >= config.distributedAttackDetection.minIPs && 
          totalRequests >= config.distributedAttackDetection.threshold) {
        
        // Distributed attack detected
        const attackPattern: AttackPattern = {
          type: 'distributed',
          severity: 'high',
          sourceIPs: Array.from(uniqueIPs).slice(0, 50), // Limit for storage
          requestCount: totalRequests,
          timeWindow: config.distributedAttackDetection.timeWindow,
          detectedAt: new Date(),
          mitigated: false
        };

        await this.recordAttackPattern(attackPattern);
        
        // Report to suspicious activity monitor
        await SuspiciousActivityMonitor.reportSuspiciousActivity({
          identifier: 'global',
          type: 'distributed_attack',
          severity: 'high',
          details: {
            uniqueIPs: uniqueIPs.size,
            totalRequests,
            timeWindow: config.distributedAttackDetection.timeWindow,
            sourceIPs: Array.from(uniqueIPs).slice(0, 10)
          }
        });
      }
    } catch (error) {
      console.error('Error checking distributed attack:', error);
    }
  }

  // Record attack pattern
  private static async recordAttackPattern(pattern: AttackPattern): Promise<void> {
    try {
      const key = `ddos:attack_pattern:${Date.now()}`;
      await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(pattern)); // 7 days retention
      
      await AuditService.logSecurityEvent(
        'ddos_attack_detected',
        pattern.severity,
        {
          attackType: pattern.type,
          sourceIPCount: pattern.sourceIPs.length,
          requestCount: pattern.requestCount,
          timeWindow: pattern.timeWindow,
          detectedAt: pattern.detectedAt.toISOString()
        }
      );
    } catch (error) {
      console.error('Error recording attack pattern:', error);
    }
  }

  // Check if IP is whitelisted
  private static isWhitelisted(ipAddress: string, whitelist: string[]): boolean {
    return whitelist.some(entry => {
      if (entry.includes('/')) {
        // CIDR notation
        return this.isIPInCIDR(ipAddress, entry);
      } else {
        // Exact match
        return ipAddress === entry;
      }
    });
  }

  // Check if IP is blacklisted
  private static isBlacklisted(ipAddress: string, blacklist: string[]): boolean {
    return blacklist.some(entry => {
      if (entry.includes('/')) {
        // CIDR notation
        return this.isIPInCIDR(ipAddress, entry);
      } else {
        // Exact match
        return ipAddress === entry;
      }
    });
  }

  // Check if IP is in CIDR range (simplified implementation)
  private static isIPInCIDR(ipAddress: string, cidr: string): boolean {
    try {
      const [network, prefixLength] = cidr.split('/');
      const prefix = parseInt(prefixLength);
      
      // Convert IP addresses to integers for comparison
      const ipInt = this.ipToInt(ipAddress);
      const networkInt = this.ipToInt(network);
      
      // Create subnet mask
      const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
      
      return (ipInt & mask) === (networkInt & mask);
    } catch (error) {
      console.error('Error checking CIDR:', error);
      return false;
    }
  }

  // Convert IP address to integer
  private static ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  // Check if IP is currently blocked
  private static async isIPBlocked(ipAddress: string): Promise<{ blocked: boolean; reason?: string; expiresAt?: number }> {
    try {
      const blockKey = `ddos:blocked_ip:${ipAddress}`;
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
      console.error('Error checking IP block status:', error);
      return { blocked: false };
    }
  }

  // Block an IP address
  private static async blockIP(ipAddress: string, durationMs: number, reason: string): Promise<void> {
    try {
      const blockKey = `ddos:blocked_ip:${ipAddress}`;
      const expiresAt = Date.now() + durationMs;
      
      await redis.setex(
        blockKey,
        Math.ceil(durationMs / 1000),
        JSON.stringify({
          reason,
          blockedAt: Date.now(),
          expiresAt
        })
      );

      await AuditService.logSecurityEvent(
        'ddos_ip_blocked',
        'high',
        {
          ipAddress,
          reason,
          durationMs,
          expiresAt: new Date(expiresAt).toISOString()
        },
        undefined,
        undefined,
        ipAddress
      );
    } catch (error) {
      console.error('Error blocking IP:', error);
      throw error;
    }
  }

  // Unblock an IP address
  static async unblockIP(ipAddress: string): Promise<void> {
    try {
      const blockKey = `ddos:blocked_ip:${ipAddress}`;
      await redis.del(blockKey);

      await AuditService.logSecurityEvent(
        'ddos_ip_unblocked',
        'low',
        { ipAddress },
        undefined,
        undefined,
        ipAddress
      );
    } catch (error) {
      console.error('Error unblocking IP:', error);
      throw error;
    }
  }

  // Get DDoS protection metrics
  static async getMetrics(): Promise<DDoSMetrics> {
    try {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      
      // Total requests in last hour
      const totalRequests = await redis.zcount('ddos:global_requests', oneHourAgo, now);
      
      // Blocked requests in last hour
      const blockedRequests = await redis.zcount('ddos:blocked_requests', oneHourAgo, now);
      
      // Unique IPs in last hour
      const requestPatterns = await redis.zrangebyscore('ddos:request_patterns', oneHourAgo, now);
      const uniqueIPs = new Set(requestPatterns).size;
      
      // Top IPs by request count
      const ipCounts: Record<string, number> = {};
      requestPatterns.forEach(ip => {
        ipCounts[ip] = (ipCounts[ip] || 0) + 1;
      });
      
      const topIPs = Object.entries(ipCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(async ([ip, requests]) => ({
          ip,
          requests,
          blocked: (await this.isIPBlocked(ip)).blocked
        }));
      
      const resolvedTopIPs = await Promise.all(topIPs);
      
      // Attacks detected (attack patterns in last hour)
      const attackKeys = await redis.keys('ddos:attack_pattern:*');
      let attacksDetected = 0;
      
      for (const key of attackKeys) {
        try {
          const data = await redis.get(key);
          if (data) {
            const pattern = JSON.parse(data);
            if (new Date(pattern.detectedAt).getTime() > oneHourAgo) {
              attacksDetected++;
            }
          }
        } catch (error) {
          console.error(`Error parsing attack pattern ${key}:`, error);
        }
      }
      
      // Currently blocked IPs
      const blockedKeys = await redis.keys('ddos:blocked_ip:*');
      const currentlyBlocked = blockedKeys.length;
      
      // Calculate request rates
      const averageRequestsPerSecond = totalRequests / 3600; // Last hour average
      
      // Peak requests per second (check in 1-minute windows)
      let peakRequestsPerSecond = 0;
      for (let i = 0; i < 60; i++) {
        const windowStart = now - (i + 1) * 60 * 1000;
        const windowEnd = now - i * 60 * 1000;
        const windowRequests = await redis.zcount('ddos:global_requests', windowStart, windowEnd);
        peakRequestsPerSecond = Math.max(peakRequestsPerSecond, windowRequests / 60);
      }
      
      return {
        totalRequests,
        blockedRequests,
        uniqueIPs,
        topIPs: resolvedTopIPs,
        attacksDetected,
        currentlyBlocked,
        averageRequestsPerSecond: Math.round(averageRequestsPerSecond * 100) / 100,
        peakRequestsPerSecond: Math.round(peakRequestsPerSecond * 100) / 100
      };
    } catch (error) {
      console.error('Error getting DDoS metrics:', error);
      return {
        totalRequests: 0,
        blockedRequests: 0,
        uniqueIPs: 0,
        topIPs: [],
        attacksDetected: 0,
        currentlyBlocked: 0,
        averageRequestsPerSecond: 0,
        peakRequestsPerSecond: 0
      };
    }
  }

  // Clean up old data
  static async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      
      // Clean up old request data
      await redis.zremrangebyscore('ddos:global_requests', 0, oneDayAgo);
      await redis.zremrangebyscore('ddos:blocked_requests', 0, oneDayAgo);
      await redis.zremrangebyscore('ddos:request_patterns', 0, oneDayAgo);
      
      // Clean up old IP request data
      const ipKeys = await redis.keys('ddos:ip_requests:*');
      for (const key of ipKeys) {
        await redis.zremrangebyscore(key, 0, oneDayAgo);
      }
      
      // Clean up old user agent data
      const uaKeys = await redis.keys('ddos:user_agents:*');
      for (const key of uaKeys) {
        await redis.zremrangebyscore(key, 0, oneDayAgo);
      }
      
      // Clean up old blocked data
      const blockedKeys = await redis.keys('ddos:blocked:*');
      for (const key of blockedKeys) {
        await redis.zremrangebyscore(key, 0, oneDayAgo);
      }
      
      await AuditService.logSystemEvent('ddos_cleanup', {
        cleanedUpTo: new Date(oneDayAgo).toISOString()
      });
    } catch (error) {
      console.error('Error during DDoS cleanup:', error);
      throw error;
    }
  }
}