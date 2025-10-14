import Redis from 'ioredis';

// Cache configuration
const CACHE_CONFIG = {
  // Default TTL in seconds
  DEFAULT_TTL: 300, // 5 minutes

  // Specific TTLs for different data types
  USER_PROFILE_TTL: 900, // 15 minutes
  COURSE_LIST_TTL: 600, // 10 minutes
  COURSE_DETAILS_TTL: 1800, // 30 minutes
  LIVE_SESSION_TTL: 60, // 1 minute
  AMBASSADOR_STATS_TTL: 300, // 5 minutes
  PAYMENT_STATUS_TTL: 30, // 30 seconds

  // Cache key prefixes
  PREFIXES: {
    USER: 'user:',
    COURSE: 'course:',
    SESSION: 'session:',
    AMBASSADOR: 'ambassador:',
    PAYMENT: 'payment:',
    ANALYTICS: 'analytics:',
    RATE_LIMIT: 'rate_limit:',
  }
};

class CacheService {
  private redis!: Redis;
  private isConnected: boolean = false;

  constructor() {
    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        enableReadyCheck: false,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 5000,
        showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis cache connected');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        // Suppress Redis connection errors in development
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ Redis cache error:', error);
        }
      });

      this.redis.on('close', () => {
        this.isConnected = false;
      });
    } catch (error) {
      this.isConnected = false;
      if (process.env.NODE_ENV === 'production') {
        console.error('Failed to initialize Redis cache:', error);
      }
    }
  }

  /**
   * Generate cache key with prefix
   */
  private generateKey(prefix: string, key: string): string {
    return `${prefix}${key}`;
  }

  /**
   * Set cache with TTL
   */
  async set(key: string, value: any, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;

      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache key
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Increment counter with TTL
   */
  async increment(key: string, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<number> {
    try {
      if (!this.isConnected) return 0;

      const multi = this.redis.multi();
      multi.incr(key);
      multi.expire(key, ttl);
      const results = await multi.exec();

      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  // Specific cache methods for different data types

  /**
   * User profile cache
   */
  async setUserProfile(userId: string, profile: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, `profile:${userId}`);
    return this.set(key, profile, CACHE_CONFIG.USER_PROFILE_TTL);
  }

  async getUserProfile(userId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, `profile:${userId}`);
    return this.get(key);
  }

  async invalidateUserProfile(userId: string): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.USER, `profile:${userId}`);
    return this.delete(key);
  }

  /**
   * Course cache
   */
  async setCourseList(filters: string, courses: any[]): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.COURSE, `list:${filters}`);
    return this.set(key, courses, CACHE_CONFIG.COURSE_LIST_TTL);
  }

  async getCourseList(filters: string): Promise<any[] | null> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.COURSE, `list:${filters}`);
    return this.get(key);
  }

  async setCourseDetails(courseId: string, course: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.COURSE, `details:${courseId}`);
    return this.set(key, course, CACHE_CONFIG.COURSE_DETAILS_TTL);
  }

  async getCourseDetails(courseId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.COURSE, `details:${courseId}`);
    return this.get(key);
  }

  async invalidateCourseCache(courseId?: string): Promise<boolean> {
    if (courseId) {
      const detailsKey = this.generateKey(CACHE_CONFIG.PREFIXES.COURSE, `details:${courseId}`);
      await this.delete(detailsKey);
    }

    // Invalidate all course lists
    const listPattern = this.generateKey(CACHE_CONFIG.PREFIXES.COURSE, 'list:*');
    return this.deletePattern(listPattern);
  }

  /**
   * Live session cache
   */
  async setLiveSessionStatus(sessionId: string, status: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.SESSION, `status:${sessionId}`);
    return this.set(key, status, CACHE_CONFIG.LIVE_SESSION_TTL);
  }

  async getLiveSessionStatus(sessionId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.SESSION, `status:${sessionId}`);
    return this.get(key);
  }

  /**
   * Ambassador stats cache
   */
  async setAmbassadorStats(ambassadorId: string, stats: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.AMBASSADOR, `stats:${ambassadorId}`);
    return this.set(key, stats, CACHE_CONFIG.AMBASSADOR_STATS_TTL);
  }

  async getAmbassadorStats(ambassadorId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.AMBASSADOR, `stats:${ambassadorId}`);
    return this.get(key);
  }

  async invalidateAmbassadorStats(ambassadorId: string): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.AMBASSADOR, `stats:${ambassadorId}`);
    return this.delete(key);
  }

  /**
   * Payment status cache
   */
  async setPaymentStatus(paymentId: string, status: any): Promise<boolean> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.PAYMENT, `status:${paymentId}`);
    return this.set(key, status, CACHE_CONFIG.PAYMENT_STATUS_TTL);
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.PAYMENT, `status:${paymentId}`);
    return this.get(key);
  }

  /**
   * Rate limiting
   */
  async incrementRateLimit(identifier: string, window: number): Promise<number> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.RATE_LIMIT, identifier);
    return this.increment(key, window);
  }

  async getRateLimit(identifier: string): Promise<number> {
    const key = this.generateKey(CACHE_CONFIG.PREFIXES.RATE_LIMIT, identifier);
    const value = await this.get<number>(key);
    return value || 0;
  }

  /**
   * Analytics cache
   */
  async setAnalyticsData(key: string, data: any, ttl: number = 3600): Promise<boolean> {
    const cacheKey = this.generateKey(CACHE_CONFIG.PREFIXES.ANALYTICS, key);
    return this.set(cacheKey, data, ttl);
  }

  async getAnalyticsData(key: string): Promise<any> {
    const cacheKey = this.generateKey(CACHE_CONFIG.PREFIXES.ANALYTICS, key);
    return this.get(cacheKey);
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(): Promise<void> {
    try {
      console.log('🔥 Starting cache warming...');

      // Warm popular courses
      // This would typically be called during deployment or scheduled

      console.log('✅ Cache warming completed');
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }

  /**
   * Cache statistics
   */
  async getStats(): Promise<any> {
    try {
      if (!this.isConnected) return null;

      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');

      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Flush all cache
   */
  async flushAll(): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Close connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      this.isConnected = false;
    } catch (error) {
      console.error('Cache disconnect error:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;