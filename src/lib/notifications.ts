import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

// Types for notification system
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  subject_template?: string;
  body_template: string;
  channels: NotificationChannel[];
  variables: string[];
  is_active: boolean;
}

export interface NotificationData {
  templateName: string;
  recipientId: string;
  channels?: NotificationChannel[];
  variables: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface QueuedNotification {
  id: string;
  template_id?: string;
  recipient_id: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  subject?: string;
  body: string;
  recipient_email?: string;
  recipient_phone?: string;
  scheduled_at: Date;
  status: NotificationStatus;
  attempts: number;
  max_attempts: number;
  metadata: Record<string, any>;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority: NotificationPriority;
  action_url?: string;
  action_data?: Record<string, any>;
  is_read: boolean;
  expires_at?: Date;
}

export interface UserNotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  preferences: Record<string, Record<NotificationChannel, boolean>>;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

export class NotificationService {
  private static isMockMode = process.env.MOCK_NOTIFICATIONS === 'true';
  private static emailTransporter: any = null;
  private static twilioClient: any = null;
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  private static redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  // Initialize services
  private static getEmailTransporter() {
    if (this.isMockMode) return null;
    
    if (!this.emailTransporter) {
      this.emailTransporter = nodemailer.createTransporter({
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

  // Template management
  static async getTemplate(name: string): Promise<NotificationTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching template:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  static async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .insert(template)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  }

  // Template rendering
  static renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    
    return rendered;
  }

  // User preferences
  static async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error fetching user preferences:', error);
        return null;
      }

      // Return default preferences if none exist
      if (!data) {
        return {
          user_id: userId,
          email_enabled: true,
          sms_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          preferences: {
            course_updates: { email: true, sms: false, push: true, in_app: true },
            enrollment_confirmations: { email: true, sms: true, push: true, in_app: true },
            payment_notifications: { email: true, sms: true, push: false, in_app: true },
            live_session_reminders: { email: true, sms: true, push: true, in_app: true },
            ambassador_updates: { email: true, sms: false, push: true, in_app: true },
            job_applications: { email: true, sms: false, push: true, in_app: true },
            system_announcements: { email: true, sms: false, push: true, in_app: true }
          },
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'Asia/Kolkata'
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserNotificationPreferences>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_notification_preferences')
        .upsert({ user_id: userId, ...preferences });

      if (error) {
        console.error('Error updating user preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  // Check if user should receive notification based on preferences
  static async shouldSendNotification(
    userId: string, 
    channel: NotificationChannel, 
    notificationType: string
  ): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    if (!preferences) return true; // Default to sending if preferences can't be fetched

    // Check global channel preference
    const channelEnabled = preferences[`${channel}_enabled` as keyof UserNotificationPreferences] as boolean;
    if (!channelEnabled) return false;

    // Check specific notification type preference
    const typePrefs = preferences.preferences[notificationType];
    if (typePrefs && !typePrefs[channel]) return false;

    // Check quiet hours (only for non-urgent notifications)
    if (preferences.quiet_hours_enabled && channel !== 'in_app') {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: preferences.timezone 
      }).slice(0, 5);
      
      const startTime = preferences.quiet_hours_start;
      const endTime = preferences.quiet_hours_end;
      
      if (startTime > endTime) {
        // Quiet hours span midnight
        if (currentTime >= startTime || currentTime <= endTime) {
          return false;
        }
      } else {
        // Quiet hours within same day
        if (currentTime >= startTime && currentTime <= endTime) {
          return false;
        }
      }
    }

    return true;
  }

  // Queue notification for processing
  static async queueNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      const template = await this.getTemplate(notificationData.templateName);
      if (!template) {
        console.error(`Template not found: ${notificationData.templateName}`);
        return false;
      }

      // Get user details
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('email, phone, profile')
        .eq('id', notificationData.recipientId)
        .single();

      if (userError || !user) {
        console.error('User not found:', userError);
        return false;
      }

      const channels = notificationData.channels || template.channels;
      const notifications = [];

      for (const channel of channels) {
        // Check if user should receive this notification
        const shouldSend = await this.shouldSendNotification(
          notificationData.recipientId,
          channel,
          notificationData.templateName
        );

        if (!shouldSend) continue;

        // Render templates
        const subject = template.subject_template 
          ? this.renderTemplate(template.subject_template, notificationData.variables)
          : undefined;
        const body = this.renderTemplate(template.body_template, notificationData.variables);

        notifications.push({
          template_id: template.id,
          recipient_id: notificationData.recipientId,
          channel,
          priority: notificationData.priority || 'normal',
          subject,
          body,
          recipient_email: user.email,
          recipient_phone: user.phone,
          scheduled_at: notificationData.scheduledAt || new Date(),
          metadata: notificationData.metadata || {}
        });
      }

      if (notifications.length === 0) {
        console.log('No notifications to queue based on user preferences');
        return true;
      }

      // Insert into queue
      const { error } = await this.supabase
        .from('notification_queue')
        .insert(notifications);

      if (error) {
        console.error('Error queueing notifications:', error);
        return false;
      }

      // Add to Redis queue for immediate processing
      for (const notification of notifications) {
        await this.redis.lpush('notification_queue', JSON.stringify(notification));
      }

      return true;
    } catch (error) {
      console.error('Error queueing notification:', error);
      return false;
    }
  }

  // Process notification queue
  static async processQueue(): Promise<void> {
    try {
      // Process Redis queue first (immediate notifications)
      const queuedItem = await this.redis.brpop('notification_queue', 1);
      if (queuedItem) {
        const notification = JSON.parse(queuedItem[1]);
        await this.processNotification(notification);
      }

      // Process scheduled notifications from database
      const { data: scheduledNotifications, error } = await this.supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .lt('attempts', 3)
        .order('priority', { ascending: false })
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching scheduled notifications:', error);
        return;
      }

      for (const notification of scheduledNotifications || []) {
        await this.processNotification(notification);
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    }
  }

  // Process individual notification
  static async processNotification(notification: QueuedNotification): Promise<void> {
    try {
      // Update attempts
      await this.supabase
        .from('notification_queue')
        .update({ 
          attempts: notification.attempts + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      let success = false;
      let errorMessage = '';

      switch (notification.channel) {
        case 'email':
          success = await this.sendEmailNotification(notification);
          break;
        case 'sms':
          success = await this.sendSMSNotification(notification);
          break;
        case 'in_app':
          success = await this.createInAppNotification(notification);
          break;
        case 'push':
          success = await this.sendPushNotification(notification);
          break;
        default:
          errorMessage = `Unsupported channel: ${notification.channel}`;
      }

      // Update notification status
      const updateData: any = {
        status: success ? 'sent' : 'failed',
        updated_at: new Date().toISOString()
      };

      if (success) {
        updateData.sent_at = new Date().toISOString();
      } else {
        updateData.failed_at = new Date().toISOString();
        updateData.error_message = errorMessage;
      }

      await this.supabase
        .from('notification_queue')
        .update(updateData)
        .eq('id', notification.id);

      // Update analytics
      await this.updateAnalytics(notification.template_id, notification.channel, success);

    } catch (error) {
      console.error('Error processing notification:', error);
      
      // Mark as failed
      await this.supabase
        .from('notification_queue')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);
    }
  }

  // Send email notification
  static async sendEmailNotification(notification: QueuedNotification): Promise<boolean> {
    if (!notification.recipient_email || !notification.subject) {
      return false;
    }

    if (this.isMockMode) {
      console.log('📧 [MOCK EMAIL]');
      console.log(`To: ${notification.recipient_email}`);
      console.log(`Subject: ${notification.subject}`);
      console.log(`Body: ${notification.body.substring(0, 100)}...`);
      return true;
    }

    try {
      const transporter = this.getEmailTransporter();
      const result = await transporter!.sendMail({
        from: process.env.SMTP_USER,
        to: notification.recipient_email,
        subject: notification.subject,
        html: notification.body
      });

      // Update with external ID if available
      if (result.messageId) {
        await this.supabase
          .from('notification_queue')
          .update({ external_id: result.messageId })
          .eq('id', notification.id);
      }

      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Send SMS notification
  static async sendSMSNotification(notification: QueuedNotification): Promise<boolean> {
    if (!notification.recipient_phone) {
      return false;
    }

    if (this.isMockMode) {
      console.log('📱 [MOCK SMS]');
      console.log(`To: ${notification.recipient_phone}`);
      console.log(`Message: ${notification.body}`);
      return true;
    }

    try {
      const client = this.getTwilioClient();
      const result = await client!.messages.create({
        body: notification.body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notification.recipient_phone
      });

      // Update with external ID
      if (result.sid) {
        await this.supabase
          .from('notification_queue')
          .update({ external_id: result.sid })
          .eq('id', notification.id);
      }

      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  // Create in-app notification
  static async createInAppNotification(notification: QueuedNotification): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('in_app_notifications')
        .insert({
          user_id: notification.recipient_id,
          title: notification.subject || 'Notification',
          message: notification.body,
          type: notification.metadata.type || 'info',
          priority: notification.priority,
          action_url: notification.metadata.action_url,
          action_data: notification.metadata.action_data,
          expires_at: notification.metadata.expires_at
        });

      return !error;
    } catch (error) {
      console.error('Error creating in-app notification:', error);
      return false;
    }
  }

  // Send push notification (placeholder)
  static async sendPushNotification(notification: QueuedNotification): Promise<boolean> {
    // TODO: Implement push notification service (Firebase, OneSignal, etc.)
    console.log('🔔 [PUSH NOTIFICATION]', {
      recipient: notification.recipient_id,
      title: notification.subject,
      body: notification.body
    });
    return true;
  }

  // Update analytics
  static async updateAnalytics(templateId: string | undefined, channel: NotificationChannel, success: boolean): Promise<void> {
    if (!templateId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existing } = await this.supabase
        .from('notification_analytics')
        .select('*')
        .eq('template_id', templateId)
        .eq('channel', channel)
        .eq('date', today)
        .single();

      if (existing) {
        const updateData = success 
          ? { sent_count: existing.sent_count + 1, delivered_count: existing.delivered_count + 1 }
          : { sent_count: existing.sent_count + 1, failed_count: existing.failed_count + 1 };

        await this.supabase
          .from('notification_analytics')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        const insertData = {
          template_id: templateId,
          channel,
          date: today,
          sent_count: 1,
          delivered_count: success ? 1 : 0,
          failed_count: success ? 0 : 1
        };

        await this.supabase
          .from('notification_analytics')
          .insert(insertData);
      }
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  // In-app notification management
  static async getInAppNotifications(userId: string, limit = 20, offset = 0): Promise<InAppNotification[]> {
    try {
      const { data, error } = await this.supabase
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching in-app notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching in-app notifications:', error);
      return [];
    }
  }

  static async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('in_app_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('in_app_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Convenience methods for common notifications (backward compatibility)
  static async sendOTPEmail(email: string, otp: string, firstName: string): Promise<boolean> {
    try {
      // Use server-side email service directly
      const { serverEmailService } = await import('./serverEmailService');
      
      return await serverEmailService.sendOTPEmail({
        to_email: email,
        to_name: firstName,
        otp_code: otp,
        expires_in: '10 minutes',
      });
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  static async sendOTPSMS(phone: string, otp: string): Promise<boolean> {
    // Get user ID from phone
    const { data: user } = await this.supabase
      .from('users')
      .select('id, profile')
      .eq('phone', phone)
      .single();

    if (!user) return false;

    const firstName = user.profile?.firstName || 'User';

    return this.queueNotification({
      templateName: 'otp_verification',
      recipientId: user.id,
      channels: ['sms'],
      variables: {
        firstName,
        type: 'Phone',
        otp,
        expiryMinutes: 10
      }
    });
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) return false;

    return this.queueNotification({
      templateName: 'welcome_email',
      recipientId: user.id,
      channels: ['email'],
      variables: { firstName }
    });
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

  // Direct send methods (for backward compatibility)
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
}