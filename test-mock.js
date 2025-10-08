// Simple test to verify mock functionality
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables:');
console.log('MOCK_NOTIFICATIONS:', process.env.MOCK_NOTIFICATIONS);
console.log('MOCK_REDIS:', process.env.MOCK_REDIS);
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);

// Test notification service
const { NotificationService } = require('./src/lib/notifications.ts');

console.log('\nTesting notification service...');
NotificationService.sendOTPEmail('test@example.com', '123456', 'Test User')
  .then(() => console.log('Email test completed'))
  .catch(err => console.error('Email test failed:', err));

// Test Redis
const { redis } = require('./src/lib/database.ts');

console.log('\nTesting Redis...');
redis.ping()
  .then(result => console.log('Redis ping result:', result))
  .catch(err => console.error('Redis test failed:', err));