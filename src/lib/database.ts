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
const isMockRedis = process.env.MOCK_REDIS === 'true';

// Mock Redis implementation for development
class MockRedis {
  private store: Map<string, string> = new Map();
  private expirations: Map<string, number> = new Map();

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
    const existed = this.store.has(key);
    this.store.delete(key);
    this.expirations.delete(key);
    return existed ? 1 : 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

let redisInstance: any = null;

export const redis = new Proxy({} as any, {
  get(target, prop) {
    if (!redisInstance) {
      if (isMockRedis) {
        redisInstance = new MockRedis();
      } else {
        // Dynamically import Redis only when needed
        const { Redis } = require('ioredis');
        redisInstance = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
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