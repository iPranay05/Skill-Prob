# Test Registration Guide

## Quick Test

Now that we've fixed the issues, you can test the registration flow:

1. **Visit the registration page**: `http://localhost:3000/auth/register`

2. **Fill out the form with test data**:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Phone: `+1234567890` (optional)
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
   - Referral Code: (leave empty for now)

3. **Submit the form** - You should see:
   - Success message: "Registration successful! Please check your email for verification."
   - Console logs showing mock email and SMS (if phone provided)
   - Redirect to OTP verification page

## What's Fixed

✅ **Frontend Pages**: Created `/auth/register`, `/auth/login`, `/auth/verify-otp` pages
✅ **Mock Notifications**: Added `MOCK_NOTIFICATIONS=true` to prevent Twilio errors
✅ **Mock Redis**: Added `MOCK_REDIS=true` to prevent Redis connection errors
✅ **Environment Variables**: Fixed JWT_REFRESH_SECRET

## Mock Mode Features

When `MOCK_NOTIFICATIONS=true`:
- Email sending is simulated with console logs
- SMS sending is simulated with console logs
- No actual emails or SMS are sent

When `MOCK_REDIS=true`:
- Redis operations use in-memory storage
- No Redis server required for development

## Console Output

You should see logs like:
```
📧 [MOCK EMAIL]
To: john.doe@example.com
Subject: Verify Your Email - Skill Probe LMS
HTML: <div style="font-family: Arial, sans-serif...

📱 [MOCK SMS]
To: +1234567890
Message: Your Skill Probe LMS verification code is: 123456...
```

## Health Check

Visit `http://localhost:3000/api/health` to see system status including mock mode indicators.