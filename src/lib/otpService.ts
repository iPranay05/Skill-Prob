import { OTPVerificationModel } from '../models/OTPVerification';
import { emailService } from './emailService';
import { User } from '../models/User';
import crypto from 'crypto';

interface SendOTPOptions {
  userId: string;
  email?: string;
  phone?: string;
  type: 'email' | 'phone';
  purpose: 'registration' | 'login' | 'password_reset' | 'email_change' | 'phone_change';
}

interface VerifyOTPOptions {
  userId: string;
  code: string;
  type: 'email' | 'phone';
}

export class OTPService {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RATE_LIMIT_MINUTES = 1; // Minimum time between OTP requests

  /**
   * Generate a random OTP code
   */
  private static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Calculate OTP expiry time
   */
  private static getExpiryTime(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + this.OTP_EXPIRY_MINUTES);
    return expiry;
  }

  /**
   * Send OTP via email using EmailJS
   */
  private static async sendEmailOTP(
    email: string,
    name: string,
    code: string,
    purpose: string
  ): Promise<boolean> {
    try {
      const expiryMinutes = this.OTP_EXPIRY_MINUTES.toString();
      
      const success = await emailService.sendOTPEmail({
        to_email: email,
        to_name: name,
        otp_code: code,
        expires_in: `${expiryMinutes} minutes`,
      });

      return success;
    } catch (error) {
      console.error('Error sending email OTP:', error);
      return false;
    }
  }

  /**
   * Send OTP via SMS using Twilio (if configured)
   */
  private static async sendSMSOTP(
    phone: string,
    code: string,
    purpose: string
  ): Promise<boolean> {
    try {
      // Check if Twilio is configured
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.warn('Twilio not configured, skipping SMS OTP');
        return false;
      }

      // Import Twilio dynamically to avoid errors if not installed
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      const message = `Your Skill Probe LMS verification code is: ${code}. This code expires in ${this.OTP_EXPIRY_MINUTES} minutes.`;

      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      console.log(`SMS OTP sent to ${phone}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS OTP:', error);
      return false;
    }
  }

  /**
   * Check rate limiting for OTP requests
   */
  private static async checkRateLimit(userId: string, type: 'email' | 'phone'): Promise<boolean> {
    try {
      // Get the most recent OTP for this user and type
      const { data, error } = await require('../lib/database').supabaseAdmin
        .from('otp_verifications')
        .select('created_at')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking rate limit:', error);
        return false;
      }

      if (data) {
        const lastOTPTime = new Date(data.created_at);
        const now = new Date();
        const timeDiff = (now.getTime() - lastOTPTime.getTime()) / (1000 * 60); // in minutes

        if (timeDiff < this.RATE_LIMIT_MINUTES) {
          return false; // Rate limited
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }
  }

  /**
   * Send OTP to user
   */
  static async sendOTP(options: SendOTPOptions): Promise<{
    success: boolean;
    message: string;
    otpId?: string;
  }> {
    try {
      const { userId, email, phone, type, purpose } = options;

      // Validate input
      if (type === 'email' && !email) {
        return { success: false, message: 'Email is required for email OTP' };
      }
      if (type === 'phone' && !phone) {
        return { success: false, message: 'Phone number is required for SMS OTP' };
      }

      // Check rate limiting
      const canSend = await this.checkRateLimit(userId, type);
      if (!canSend) {
        return {
          success: false,
          message: `Please wait ${this.RATE_LIMIT_MINUTES} minute(s) before requesting another OTP`,
        };
      }

      // Get user details for personalization
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const userName = user.profile?.firstName || user.email.split('@')[0];

      // Delete any existing unverified OTPs for this user and type
      await OTPVerificationModel.deleteUnverifiedByUserAndType(userId, type);

      // Generate new OTP
      const code = this.generateOTP();
      const expiresAt = this.getExpiryTime();

      // Create OTP record
      const otpRecord = await OTPVerificationModel.create({
        userId,
        type,
        code,
        purpose,
        expiresAt,
        verified: false,
        attempts: 0,
      });

      // Send OTP based on type
      let sendSuccess = false;
      if (type === 'email' && email) {
        sendSuccess = await this.sendEmailOTP(email, userName, code, purpose);
      } else if (type === 'phone' && phone) {
        sendSuccess = await this.sendSMSOTP(phone, code, purpose);
      }

      if (!sendSuccess) {
        return {
          success: false,
          message: `Failed to send OTP via ${type}. Please try again.`,
        };
      }

      return {
        success: true,
        message: `OTP sent successfully via ${type}`,
        otpId: otpRecord.id,
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(options: VerifyOTPOptions): Promise<{
    success: boolean;
    message: string;
    otpRecord?: any;
  }> {
    try {
      const { userId, code, type } = options;

      // Find valid OTP
      const otpRecord = await OTPVerificationModel.findValidOTP(userId, type, code);

      if (!otpRecord) {
        return {
          success: false,
          message: 'Invalid or expired OTP code',
        };
      }

      // Check if already verified
      if (otpRecord.verified) {
        return {
          success: false,
          message: 'OTP code has already been used',
        };
      }

      // Check attempts limit
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        };
      }

      // Check expiry
      if (new Date() > new Date(otpRecord.expiresAt)) {
        return {
          success: false,
          message: 'OTP code has expired. Please request a new one.',
        };
      }

      // Verify the code
      if (otpRecord.code !== code) {
        // Increment attempts
        await OTPVerificationModel.update(otpRecord.id, {
          attempts: otpRecord.attempts + 1,
        });

        return {
          success: false,
          message: 'Invalid OTP code',
        };
      }

      // Mark as verified
      const verifiedOTP = await OTPVerificationModel.markAsVerified(otpRecord.id);

      return {
        success: true,
        message: 'OTP verified successfully',
        otpRecord: verifiedOTP,
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      };
    }
  }

  /**
   * Resend OTP (with rate limiting)
   */
  static async resendOTP(options: SendOTPOptions): Promise<{
    success: boolean;
    message: string;
    otpId?: string;
  }> {
    // Resend is the same as send, but we might want different rate limiting
    return this.sendOTP(options);
  }

  /**
   * Clean up expired OTPs (should be run periodically)
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      await OTPVerificationModel.deleteExpired();
      console.log('Expired OTPs cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  /**
   * Get OTP statistics for monitoring
   */
  static async getOTPStats(userId: string): Promise<{
    totalSent: number;
    totalVerified: number;
    pendingVerification: number;
  }> {
    try {
      const { data, error } = await require('../lib/database').supabaseAdmin
        .from('otp_verifications')
        .select('verified')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const totalSent = data.length;
      const totalVerified = data.filter(otp => otp.verified).length;
      const pendingVerification = data.filter(otp => !otp.verified).length;

      return {
        totalSent,
        totalVerified,
        pendingVerification,
      };
    } catch (error) {
      console.error('Error getting OTP stats:', error);
      return {
        totalSent: 0,
        totalVerified: 0,
        pendingVerification: 0,
      };
    }
  }
}

export default OTPService;