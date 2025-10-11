import { serverEmailService } from './serverEmailService';

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

export class EmailService {
  constructor() {
    // Using server-side email service
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(data: OTPEmailData): Promise<boolean> {
    try {
      return await serverEmailService.sendOTPEmail(data);
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
      return await serverEmailService.sendWelcomeEmail(data);
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
      return await serverEmailService.sendNotificationEmail(data);
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
      return await serverEmailService.sendPasswordResetEmail(email, name, resetToken);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Send course enrollment confirmation email
   */
  async sendEnrollmentConfirmationEmail(
    email: string,
    name: string,
    courseName: string,
    courseUrl: string
  ): Promise<boolean> {
    try {
      return await serverEmailService.sendNotificationEmail({
        to_email: email,
        to_name: name,
        subject: `Enrollment Confirmed: ${courseName}`,
        message: `Congratulations! You have successfully enrolled in ${courseName}. You can now access the course content and start learning.`,
        action_url: courseUrl,
        action_text: 'Access Course',
      });
    } catch (error) {
      console.error('Error sending enrollment confirmation email:', error);
      return false;
    }
  }

  /**
   * Send live session reminder email
   */
  async sendSessionReminderEmail(
    email: string,
    name: string,
    sessionTitle: string,
    sessionDate: Date,
    joinUrl: string
  ): Promise<boolean> {
    try {
      const sessionDateTime = `${sessionDate.toLocaleDateString()} at ${sessionDate.toLocaleTimeString()}`;
      
      return await serverEmailService.sendNotificationEmail({
        to_email: email,
        to_name: name,
        subject: `Reminder: ${sessionTitle} starts soon`,
        message: `This is a reminder that your live session "${sessionTitle}" is scheduled for ${sessionDateTime}. Don't miss out on this valuable learning opportunity!`,
        action_url: joinUrl,
        action_text: 'Join Session',
      });
    } catch (error) {
      console.error('Error sending session reminder email:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<boolean> {
    try {
      return await serverEmailService.testConfiguration();
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();