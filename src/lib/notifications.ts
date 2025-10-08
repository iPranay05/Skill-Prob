import nodemailer from 'nodemailer';
import twilio from 'twilio';

export class NotificationService {
  private static isMockMode = process.env.MOCK_NOTIFICATIONS === 'true';
  private static emailTransporter: any = null;
  private static twilioClient: any = null;

  private static getEmailTransporter() {
    if (this.isMockMode) return null;
    
    if (!this.emailTransporter) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    return this.emailTransporter;
  }

  private static getTwilioClient() {
    if (this.isMockMode) return null;
    
    if (!this.twilioClient) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
    return this.twilioClient;
  }

  static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (this.isMockMode) {
      console.log('📧 [MOCK EMAIL]');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML: ${html.substring(0, 100)}...`);
      return true;
    }

    try {
      const transporter = this.getEmailTransporter();
      await transporter!.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html
      });
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  static async sendSMS(to: string, message: string): Promise<boolean> {
    if (this.isMockMode) {
      console.log('📱 [MOCK SMS]');
      console.log(`To: ${to}`);
      console.log(`Message: ${message}`);
      return true;
    }

    try {
      const client = this.getTwilioClient();
      await client!.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  static async sendOTPEmail(email: string, otp: string, firstName: string): Promise<boolean> {
    const subject = 'Verify Your Email - Skill Probe LMS';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for registering with Skill Probe LMS. Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #333; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <p>Best regards,<br>Skill Probe LMS Team</p>
      </div>
    `;
    
    return this.sendEmail(email, subject, html);
  }

  static async sendOTPSMS(phone: string, otp: string): Promise<boolean> {
    const message = `Your Skill Probe LMS verification code is: ${otp}. This code will expire in 10 minutes.`;
    return this.sendSMS(phone, message);
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const subject = 'Welcome to Skill Probe LMS!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Skill Probe LMS!</h2>
        <p>Hi ${firstName},</p>
        <p>Welcome to Skill Probe LMS! Your account has been successfully created and verified.</p>
        <p>You can now:</p>
        <ul>
          <li>Browse and enroll in courses</li>
          <li>Attend live sessions</li>
          <li>Access recorded content</li>
          <li>Apply for internships</li>
        </ul>
        <p>Get started by exploring our course catalog!</p>
        <p>Best regards,<br>Skill Probe LMS Team</p>
      </div>
    `;
    
    return this.sendEmail(email, subject, html);
  }

  static async sendPasswordResetEmail(email: string, resetToken: string, firstName: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password - Skill Probe LMS';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <p>Best regards,<br>Skill Probe LMS Team</p>
      </div>
    `;
    
    return this.sendEmail(email, subject, html);
  }
}