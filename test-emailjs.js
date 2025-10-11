// Test EmailJS Configuration
// Run this with: node test-emailjs.js

const { emailService } = require('./src/lib/emailService');

async function testEmailJS() {
  console.log('Testing EmailJS configuration...');
  
  try {
    // Test OTP email
    const otpResult = await emailService.sendOTPEmail({
      to_email: 'your-test-email@example.com', // Replace with your email
      to_name: 'Test User',
      otp_code: '123456',
      expires_in: '10 minutes',
    });
    
    console.log('OTP Email sent:', otpResult);
    
    // Test welcome email
    const welcomeResult = await emailService.sendWelcomeEmail({
      to_email: 'your-test-email@example.com', // Replace with your email
      to_name: 'Test User',
      login_url: 'http://localhost:3000/auth/login',
    });
    
    console.log('Welcome Email sent:', welcomeResult);
    
  } catch (error) {
    console.error('EmailJS test failed:', error);
  }
}

testEmailJS();