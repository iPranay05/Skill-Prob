import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface OTPEmailData {
  to_email: string;
  to_name: string;
  otp_code: string;
  expires_in: string;
}

interface WelcomeEmailData {
  to_email: string;
  to_name: string;
  login_url: string;
}

interface NotificationEmailData {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  action_url?: string;
  action_text?: string;
}

export class ServerEmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    // Get configuration from environment variables
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.fromEmail = process.env.SMTP_USER || 'noreply@skillprobe.com';

    // Create transporter
    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(data: OTPEmailData): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.error('SMTP not configured properly');
        return false;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - Skill Probe LMS</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #4F46E5; 
              text-align: center; 
              padding: 20px; 
              background: white; 
              border: 2px dashed #4F46E5; 
              margin: 20px 0; 
            }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Skill Probe LMS</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.to_name},</h2>
              <p>Your verification code for Skill Probe LMS is:</p>
              <div class="otp-code">${data.otp_code}</div>
              <p>This code will expire in ${data.expires_in}.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>Skill Probe LMS Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Skill Probe LMS" <${this.fromEmail}>`,
        to: data.to_email,
        subject: 'Verify Your Email - Skill Probe LMS',
        html: htmlContent,
        text: `Hello ${data.to_name},\n\nYour verification code for Skill Probe LMS is: ${data.otp_code}\n\nThis code will expire in ${data.expires_in}.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nSkill Probe LMS Team`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.error('SMTP not configured properly');
        return false;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Skill Probe LMS!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background: #4F46E5; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Skill Probe LMS!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.to_name},</h2>
              <p>Welcome to Skill Probe LMS! Your account has been successfully created and verified.</p>
              <p>You can now access all our courses, live sessions, and learning resources.</p>
              <div style="text-align: center;">
                <a href="${data.login_url}" class="button">Login to Your Account</a>
              </div>
              <p>If you have any questions, feel free to contact our support team.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>Skill Probe LMS Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Skill Probe LMS" <${this.fromEmail}>`,
        to: data.to_email,
        subject: 'Welcome to Skill Probe LMS!',
        html: htmlContent,
        text: `Hello ${data.to_name},\n\nWelcome to Skill Probe LMS! Your account has been successfully created and verified.\n\nYou can now access all our courses, live sessions, and learning resources.\n\nLogin here: ${data.login_url}\n\nIf you have any questions, feel free to contact our support team.\n\nBest regards,\nSkill Probe LMS Team`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Send general notification email
   */
  async sendNotificationEmail(data: NotificationEmailData): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.error('SMTP not configured properly');
        return false;
      }

      const actionButton = data.action_url && data.action_text ? 
        `<div style="text-align: center; margin: 20px 0;">
          <a href="${data.action_url}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">${data.action_text}</a>
        </div>` : '';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${data.subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Skill Probe LMS</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.to_name},</h2>
              <p>${data.message}</p>
              ${actionButton}
            </div>
            <div class="footer">
              <p>Best regards,<br>Skill Probe LMS Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Skill Probe LMS" <${this.fromEmail}>`,
        to: data.to_email,
        subject: data.subject,
        html: htmlContent,
        text: `Hello ${data.to_name},\n\n${data.message}\n\n${data.action_url ? `${data.action_text}: ${data.action_url}\n\n` : ''}Best regards,\nSkill Probe LMS Team`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Notification email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending notification email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.error('SMTP not configured properly');
        return false;
      }

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password - Skill Probe LMS</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background: #4F46E5; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Skill Probe LMS</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>You requested to reset your password for your Skill Probe LMS account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <p><small>This link will expire in 1 hour for security reasons.</small></p>
            </div>
            <div class="footer">
              <p>Best regards,<br>Skill Probe LMS Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Skill Probe LMS" <${this.fromEmail}>`,
        to: email,
        subject: 'Reset Your Password - Skill Probe LMS',
        html: htmlContent,
        text: `Hello ${name},\n\nYou requested to reset your password for your Skill Probe LMS account.\n\nReset your password here: ${resetUrl}\n\nIf you didn't request this password reset, please ignore this email.\n\nThis link will expire in 1 hour for security reasons.\n\nBest regards,\nSkill Probe LMS Team`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Check if SMTP is properly configured
   */
  private isConfigured(): boolean {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.error('SMTP configuration missing');
        return false;
      }

      await this.transporter.verify();
      console.log('SMTP configuration is valid');
      return true;
    } catch (error) {
      console.error('SMTP configuration test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const serverEmailService = new ServerEmailService();