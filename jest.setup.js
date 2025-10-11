// Jest setup file
import '@testing-library/jest-dom';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-purposes-only';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/callback';
process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.HMAC_SECRET = 'test-hmac-secret';

// EmailJS Configuration for testing
process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID = 'test-service-id';
process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY = 'test-public-key';
process.env.NEXT_PUBLIC_EMAILJS_OTP_TEMPLATE = 'otp_verification';
process.env.NEXT_PUBLIC_EMAILJS_WELCOME_TEMPLATE = 'welcome_email';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock Next.js Request and Response for security tests
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
  }
};

global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }
};

global.Headers = class MockHeaders extends Map {
  constructor(init) {
    super();
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }
  
  get(name) {
    return super.get(name.toLowerCase());
  }
  
  set(name, value) {
    return super.set(name.toLowerCase(), value);
  }
  
  has(name) {
    return super.has(name.toLowerCase());
  }
};

// Mock File API
global.File = class MockFile {
  constructor(content, name, options = {}) {
    this.content = content;
    this.name = name;
    this.type = options.type || '';
    this.size = Array.isArray(content) ? content.join('').length : content.length;
  }
};

// Twilio is now optional - only set if needed for SMS testing
// process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
// process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
// process.env.TWILIO_PHONE_NUMBER = '+1234567890';