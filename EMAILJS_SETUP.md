# EmailJS Setup Guide

This guide explains how to set up EmailJS for sending verification emails and other notifications in the Skill Probe LMS.

## Why EmailJS?

EmailJS allows you to send emails directly from the client-side without needing a backend email server. This is perfect for:
- OTP verification emails
- Welcome emails
- Password reset emails
- Course enrollment confirmations
- Session reminders

## Setup Steps

### 1. Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Create Email Service

1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

### 3. Create Email Templates

Create the following templates in your EmailJS dashboard:

#### OTP Verification Template (ID: `otp_verification`)
```html
Subject: Verify Your Email - Skill Probe LMS

Hello {{to_name}},

Your verification code is: {{otp_code}}

This code will expire in {{expires_in}}.

If you didn't request this code, please ignore this email.

Best regards,
Skill Probe LMS Team
```

#### Welcome Email Template (ID: `welcome_email`)
```html
Subject: Welcome to Skill Probe LMS!

Hello {{to_name}},

Welcome to Skill Probe LMS! Your account has been successfully verified.

You can now log in and start your learning journey:
{{login_url}}

Best regards,
Skill Probe LMS Team
```

#### Password Reset Template (ID: `password_reset`)
```html
Subject: Reset Your Password - Skill Probe LMS

Hello {{to_name}},

Click the link below to reset your password:
{{reset_url}}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
Skill Probe LMS Team
```

#### Enrollment Confirmation Template (ID: `enrollment_confirmation`)
```html
Subject: {{subject}}

Hello {{to_name}},

Congratulations! You have successfully enrolled in {{course_name}}.

Access your course here: {{course_url}}

Happy learning!

Best regards,
Skill Probe LMS Team
```

#### Session Reminder Template (ID: `session_reminder`)
```html
Subject: {{subject}}

Hello {{to_name}},

This is a reminder that your live session "{{session_title}}" is starting soon.

Session Details:
- Date: {{session_date}}
- Time: {{session_time}}

Join the session: {{join_url}}

See you there!

Best regards,
Skill Probe LMS Team
```

#### Notification Template (ID: `notification_email`)
```html
Subject: {{subject}}

Hello {{to_name}},

{{message}}

{{#action_url}}
{{action_text}}: {{action_url}}
{{/action_url}}

Best regards,
Skill Probe LMS Team
```

### 4. Get Your Public Key

1. In your EmailJS dashboard, go to "Account"
2. Find your **Public Key**
3. Copy it for use in environment variables

### 5. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here

# Email Templates
NEXT_PUBLIC_EMAILJS_OTP_TEMPLATE=otp_verification
NEXT_PUBLIC_EMAILJS_WELCOME_TEMPLATE=welcome_email
NEXT_PUBLIC_EMAILJS_NOTIFICATION_TEMPLATE=notification_email
NEXT_PUBLIC_EMAILJS_PASSWORD_RESET_TEMPLATE=password_reset
NEXT_PUBLIC_EMAILJS_ENROLLMENT_TEMPLATE=enrollment_confirmation
NEXT_PUBLIC_EMAILJS_SESSION_REMINDER_TEMPLATE=session_reminder

# App URL for links in emails
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Test Your Setup

You can test your EmailJS configuration by running:

```javascript
import { emailService } from './src/lib/emailService';

// Test configuration
const isConfigured = await emailService.testConfiguration();
console.log('EmailJS configured:', isConfigured);
```

## Usage Examples

### Send OTP Email

```javascript
import { emailService } from './src/lib/emailService';

await emailService.sendOTPEmail({
  to_email: 'user@example.com',
  to_name: 'John Doe',
  otp_code: '123456',
  expires_in: '10 minutes',
});
```

### Send Welcome Email

```javascript
await emailService.sendWelcomeEmail({
  to_email: 'user@example.com',
  to_name: 'John Doe',
  login_url: 'https://yourapp.com/login',
});
```

### Using OTP Service

```javascript
import OTPService from './src/lib/otpService';

// Send OTP
const result = await OTPService.sendOTP({
  userId: 'user-123',
  email: 'user@example.com',
  type: 'email',
  purpose: 'registration',
});

// Verify OTP
const verification = await OTPService.verifyOTP({
  userId: 'user-123',
  code: '123456',
  type: 'email',
});
```

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check your service configuration and template IDs
2. **Rate limiting**: EmailJS has rate limits on free accounts
3. **Spam folder**: Emails might end up in spam, especially during testing

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

### Fallback Options

If EmailJS fails, the system will:
1. Log the error
2. Return `false` from email sending functions
3. Continue with the rest of the application flow

## Security Notes

- EmailJS public key is safe to expose in client-side code
- Never expose your private key or service credentials
- Use environment variables for all configuration
- Consider rate limiting for production use

## Limitations

- Free tier has monthly email limits
- Client-side sending means users can see the configuration
- No server-side email queue or retry logic
- Limited template customization compared to server-side solutions

## Alternative: Twilio SMS

For SMS OTP, you can optionally configure Twilio:

```bash
# Optional: Twilio for SMS OTP
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

The OTP service will automatically use Twilio if configured, otherwise it will skip SMS sending.