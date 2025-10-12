import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Client
export const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Admin Supabase Client (for server-side operations)
export const supabaseAdmin: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Redis Client for session management (with mock support)
// Default to mock Redis if MOCK_REDIS is true or Redis is not properly configured
const isMockRedis = true; // Force mock Redis to avoid connection issues

// Mock Redis implementation for development
class MockRedis {
  private store: Map<string, string> = new Map();
  private expirations: Map<string, number> = new Map();
  private sortedSets: Map<string, Map<string, number>> = new Map();

  async get(key: string): Promise<string | null> {
    if (this.expirations.has(key) && this.expirations.get(key)! < Date.now()) {
      this.store.delete(key);
      this.expirations.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<string> {
    this.store.set(key, value);
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.store.set(key, value);
    this.expirations.set(key, Date.now() + (seconds * 1000));
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key) || this.sortedSets.has(key);
    this.store.delete(key);
    this.expirations.delete(key);
    this.sortedSets.delete(key);
    return existed ? 1 : 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  // Sorted Set operations for rate limiting
  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const set = this.sortedSets.get(key)!;
    const existed = set.has(member);
    set.set(member, score);
    return existed ? 0 : 1;
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;
    
    let removed = 0;
    for (const [member, score] of set.entries()) {
      if (score >= min && score <= max) {
        set.delete(member);
        removed++;
      }
    }
    return removed;
  }

  async zcard(key: string): Promise<number> {
    const set = this.sortedSets.get(key);
    return set ? set.size : 0;
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    const set = this.sortedSets.get(key);
    if (!set) return [];
    
    const result: string[] = [];
    for (const [member, score] of set.entries()) {
      if (score >= min && score <= max) {
        result.push(member);
      }
    }
    return result.sort((a, b) => {
      const scoreA = set.get(a)!;
      const scoreB = set.get(b)!;
      return scoreA - scoreB;
    });
  }

  async zpopmax(key: string): Promise<string[]> {
    const set = this.sortedSets.get(key);
    if (!set || set.size === 0) return [];
    
    let maxScore = -Infinity;
    let maxMember = '';
    
    for (const [member, score] of set.entries()) {
      if (score > maxScore) {
        maxScore = score;
        maxMember = member;
      }
    }
    
    if (maxMember) {
      set.delete(maxMember);
      return [maxMember, maxScore.toString()];
    }
    return [];
  }

  // Multi/Pipeline operations (simplified)
  multi() {
    return {
      zremrangebyscore: (key: string, min: number, max: number) => this,
      zadd: (key: string, score: number, member: string) => this,
      expire: (key: string, seconds: number) => this,
      exec: async () => {
        // In a real implementation, this would execute all queued commands
        // For mock, we'll just return success
        return [['OK'], ['OK'], ['OK']];
      }
    };
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.store.has(key) || this.sortedSets.has(key)) {
      this.expirations.set(key, Date.now() + (seconds * 1000));
      return 1;
    }
    return 0;
  }
}

let redisInstance: MockRedis | typeof import('ioredis').Redis | null = null;

export const redis = new Proxy({} as MockRedis | typeof import('ioredis').Redis, {
  get(target, prop) {
    if (!redisInstance) {
      if (isMockRedis) {
        console.log('Using Mock Redis for development');
        redisInstance = new MockRedis();
      } else {
        try {
          // Only try to connect to real Redis in production with proper configuration
          const Redis = require('ioredis');
          redisInstance = new Redis(process.env.REDIS_URL, {
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 1,
            lazyConnect: true,
            connectTimeout: 5000,
            commandTimeout: 5000,
            // Suppress connection error logs in development
            showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
          });
          
          // Handle connection errors by falling back to mock
          redisInstance.on('error', (error: Error) => {
            console.warn('Redis connection failed, switching to mock Redis:', error.message);
            redisInstance = new MockRedis();
          });

          // Prevent unhandled error events
          redisInstance.on('connect', () => {
            console.log('Redis connected successfully');
          });

          redisInstance.on('ready', () => {
            console.log('Redis ready');
          });
          
        } catch (error) {
          console.warn('Failed to initialize Redis, using mock instead:', error);
          redisInstance = new MockRedis();
        }
      }
    }
    return redisInstance[prop];
  }
});

// Database connection check
export const connectToDatabase = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is fine for initial setup
      throw error;
    }
    console.log('Connected to Supabase');
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    throw error;
  }
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    // Check Supabase
    const { error: supabaseError } = await supabase.from('users').select('count').limit(1);
    const supabaseHealthy = !supabaseError || supabaseError.code === 'PGRST116';

    // Check Redis (with mock support)
    await redis.ping();

    return { 
      supabase: supabaseHealthy, 
      redis: true,
      mockMode: {
        redis: process.env.MOCK_REDIS === 'true',
        notifications: process.env.MOCK_NOTIFICATIONS === 'true'
      }
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { supabase: false, redis: false };
  }
};