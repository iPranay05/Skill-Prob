#!/usr/bin/env node

/**
 * EmailJS Setup Helper Script
 * 
 * This script helps you set up EmailJS for the Skill Probe LMS project.
 * It will guide you through the process of getting your EmailJS credentials.
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    console.log('\n🚀 EmailJS Setup Helper for Skill Probe LMS\n');
    console.log('This script will help you configure EmailJS for sending emails.\n');

    console.log('📋 Before we start, make sure you have:');
    console.log('1. Created an EmailJS account at https://emailjs.com');
    console.log('2. Set up an email service (Gmail, Outlook, etc.)');
    console.log('3. Created the required email templates\n');

    const proceed = await question('Do you want to continue? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        rl.close();
        return;
    }

    console.log('\n📧 EmailJS Configuration\n');

    // Get EmailJS credentials
    const serviceId = await question('Enter your EmailJS Service ID: ');
    const publicKey = await question('Enter your EmailJS Public Key: ');

    console.log('\n📝 Template Configuration\n');
    console.log('The following template IDs are already configured:');
    console.log('- OTP Verification: otp_verification');
    console.log('- Welcome Email: welcome_email');
    console.log('- Notification: notification_email');
    console.log('- Password Reset: password_reset');
    console.log('- Enrollment: enrollment_confirmation');
    console.log('- Session Reminder: session_reminder\n');

    const useDefaultTemplates = await question('Use these default template IDs? (y/n): ');

    let templates = {
        otp: 'otp_verification',
        welcome: 'welcome_email',
        notification: 'notification_email',
        passwordReset: 'password_reset',
        enrollment: 'enrollment_confirmation',
        sessionReminder: 'session_reminder'
    };

    if (useDefaultTemplates.toLowerCase() !== 'y') {
        console.log('\nEnter your custom template IDs:');
        templates.otp = await question('OTP Verification template ID: ') || templates.otp;
        templates.welcome = await question('Welcome email template ID: ') || templates.welcome;
        templates.notification = await question('Notification template ID: ') || templates.notification;
        templates.passwordReset = await question('Password reset template ID: ') || templates.passwordReset;
        templates.enrollment = await question('Enrollment template ID: ') || templates.enrollment;
        templates.sessionReminder = await question('Session reminder template ID: ') || templates.sessionReminder;
    }

    // Update .env.local file
    const envPath = path.join(__dirname, '..', '.env.local');
    let envContent = '';

    try {
        envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
        console.log('\n⚠️  .env.local file not found. Creating a new one...');
    }

    // Update or add EmailJS configuration
    const emailjsConfig = `
# EmailJS Configuration (for client-side email sending)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=${serviceId}
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=${publicKey}

# Email Templates
NEXT_PUBLIC_EMAILJS_OTP_TEMPLATE=${templates.otp}
NEXT_PUBLIC_EMAILJS_WELCOME_TEMPLATE=${templates.welcome}
NEXT_PUBLIC_EMAILJS_NOTIFICATION_TEMPLATE=${templates.notification}
NEXT_PUBLIC_EMAILJS_PASSWORD_RESET_TEMPLATE=${templates.passwordReset}
NEXT_PUBLIC_EMAILJS_ENROLLMENT_TEMPLATE=${templates.enrollment}
NEXT_PUBLIC_EMAILJS_SESSION_REMINDER_TEMPLATE=${templates.sessionReminder}

# App URL for links in emails
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

    // Remove existing EmailJS configuration if present
    envContent = envContent.replace(/# EmailJS Configuration[\s\S]*?(?=\n#|\n[A-Z]|$)/g, '');
    envContent = envContent.replace(/NEXT_PUBLIC_EMAILJS_.*=.*\n/g, '');
    envContent = envContent.replace(/NEXT_PUBLIC_APP_URL=.*\n/g, '');

    // Add new configuration
    envContent += emailjsConfig;

    // Write updated .env.local
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ EmailJS configuration updated in .env.local');

    // Test configuration
    console.log('\n🧪 Testing EmailJS Configuration...');

    try {
        // Import and test the email service
        const { emailService } = require('../src/lib/emailService');

        console.log('📧 EmailJS service loaded successfully');
        console.log('\n📋 Next Steps:');
        console.log('1. Make sure you have created all the required templates in your EmailJS dashboard');
        console.log('2. Test sending an email using the OTP verification component');
        console.log('3. Check your email templates have the correct variable names');

        console.log('\n📖 Template Variables Reference:');
        console.log('OTP Template: {{to_name}}, {{to_email}}, {{otp_code}}, {{expires_in}}');
        console.log('Welcome Template: {{to_name}}, {{to_email}}, {{login_url}}');
        console.log('Notification Template: {{to_name}}, {{to_email}}, {{subject}}, {{message}}, {{action_url}}, {{action_text}}');
        console.log('Password Reset Template: {{to_name}}, {{to_email}}, {{reset_url}}');
        console.log('Enrollment Template: {{to_name}}, {{to_email}}, {{course_name}}, {{course_url}}');
        console.log('Session Reminder Template: {{to_name}}, {{to_email}}, {{session_title}}, {{session_date}}, {{session_time}}, {{join_url}}');

    } catch (error) {
        console.log('⚠️  Could not test EmailJS service. Make sure to restart your development server.');
    }

    console.log('\n🎉 EmailJS setup complete!');
    console.log('\nFor detailed setup instructions, see: EMAILJS_SETUP.md');

    rl.close();
}

main().catch(console.error);