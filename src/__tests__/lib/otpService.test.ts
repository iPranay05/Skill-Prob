import OTPService from '../../lib/otpService';
import { OTPVerificationModel } from '../../models/OTPVerification';
import { User } from '../../models/User';
import { emailService } from '../../lib/emailService';

// Mock dependencies
jest.mock('../../models/OTPVerification');
jest.mock('../../models/User');
jest.mock('../../lib/emailService');
jest.mock('../../lib/database');

const mockOTPVerificationModel = OTPVerificationModel as jest.Mocked<typeof OTPVerificationModel>;
const mockUserModel = User as jest.Mocked<typeof User>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;

describe('OTPService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendOTP', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      profile: { firstName: 'John' },
    };

    beforeEach(() => {
      mockUserModel.findById.mockResolvedValue(mockUser as any);
      mockOTPVerificationModel.deleteUnverifiedByUserAndType.mockResolvedValue();
      mockOTPVerificationModel.create.mockResolvedValue({
        id: 'otp-123',
        userId: 'user-123',
        type: 'email',
        code: '123456',
        purpose: 'registration',
        expiresAt: new Date(),
        verified: false,
        attempts: 0,
      } as any);
    });

    it('should send email OTP successfully', async () => {
      mockEmailService.sendOTPEmail.mockResolvedValue(true);

      const result = await OTPService.sendOTP({
        userId: 'user-123',
        email: 'test@example.com',
        type: 'email',
        purpose: 'registration',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully via email');
      expect(result.otpId).toBe('otp-123');
      expect(mockEmailService.sendOTPEmail).toHaveBeenCalledWith({
        to_email: 'test@example.com',
        to_name: 'John',
        otp_code: expect.any(String),
        expires_in: '10 minutes',
      });
    });

    it('should fail when email is required but not provided', async () => {
      const result = await OTPService.sendOTP({
        userId: 'user-123',
        type: 'email',
        purpose: 'registration',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email is required for email OTP');
    });

    it('should fail when phone is required but not provided', async () => {
      const result = await OTPService.sendOTP({
        userId: 'user-123',
        type: 'phone',
        purpose: 'registration',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Phone number is required for SMS OTP');
    });

    it('should fail when user is not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      const result = await OTPService.sendOTP({
        userId: 'user-123',
        email: 'test@example.com',
        type: 'email',
        purpose: 'registration',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });

    it('should fail when email sending fails', async () => {
      mockEmailService.sendOTPEmail.mockResolvedValue(false);

      const result = await OTPService.sendOTP({
        userId: 'user-123',
        email: 'test@example.com',
        type: 'email',
        purpose: 'registration',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send OTP via email. Please try again.');
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit check to return false
      const mockSupabaseAdmin = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { created_at: new Date().toISOString() }, // Recent OTP
          error: null,
        }),
      };

      require('../../lib/database').supabaseAdmin = mockSupabaseAdmin;

      const result = await OTPService.sendOTP({
        userId: 'user-123',
        email: 'test@example.com',
        type: 'email',
        purpose: 'registration',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Please wait');
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP successfully', async () => {
      const mockOTPRecord = {
        id: 'otp-123',
        userId: 'user-123',
        type: 'email',
        code: '123456',
        verified: false,
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      };

      mockOTPVerificationModel.findValidOTP.mockResolvedValue(mockOTPRecord as any);
      mockOTPVerificationModel.markAsVerified.mockResolvedValue({
        ...mockOTPRecord,
        verified: true,
      } as any);

      const result = await OTPService.verifyOTP({
        userId: 'user-123',
        code: '123456',
        type: 'email',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP verified successfully');
      expect(mockOTPVerificationModel.markAsVerified).toHaveBeenCalledWith('otp-123');
    });

    it('should fail with invalid OTP', async () => {
      mockOTPVerificationModel.findValidOTP.mockResolvedValue(null);

      const result = await OTPService.verifyOTP({
        userId: 'user-123',
        code: '123456',
        type: 'email',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired OTP code');
    });

    it('should fail with already verified OTP', async () => {
      const mockOTPRecord = {
        id: 'otp-123',
        userId: 'user-123',
        type: 'email',
        code: '123456',
        verified: true, // Already verified
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockOTPVerificationModel.findValidOTP.mockResolvedValue(mockOTPRecord as any);

      const result = await OTPService.verifyOTP({
        userId: 'user-123',
        code: '123456',
        type: 'email',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('OTP code has already been used');
    });

    it('should fail when maximum attempts exceeded', async () => {
      const mockOTPRecord = {
        id: 'otp-123',
        userId: 'user-123',
        type: 'email',
        code: '123456',
        verified: false,
        attempts: 3, // Max attempts reached
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockOTPVerificationModel.findValidOTP.mockResolvedValue(mockOTPRecord as any);

      const result = await OTPService.verifyOTP({
        userId: 'user-123',
        code: '123456',
        type: 'email',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Maximum verification attempts exceeded. Please request a new OTP.');
    });

    it('should fail with expired OTP', async () => {
      const mockOTPRecord = {
        id: 'otp-123',
        userId: 'user-123',
        type: 'email',
        code: '123456',
        verified: false,
        attempts: 0,
        expiresAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      };

      mockOTPVerificationModel.findValidOTP.mockResolvedValue(mockOTPRecord as any);

      const result = await OTPService.verifyOTP({
        userId: 'user-123',
        code: '123456',
        type: 'email',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('OTP code has expired. Please request a new one.');
    });

    it('should increment attempts on wrong code', async () => {
      const mockOTPRecord = {
        id: 'otp-123',
        userId: 'user-123',
        type: 'email',
        code: '123456',
        verified: false,
        attempts: 1,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockOTPVerificationModel.findValidOTP.mockResolvedValue(mockOTPRecord as any);
      mockOTPVerificationModel.update.mockResolvedValue(mockOTPRecord as any);

      const result = await OTPService.verifyOTP({
        userId: 'user-123',
        code: '654321', // Wrong code
        type: 'email',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid OTP code');
      expect(mockOTPVerificationModel.update).toHaveBeenCalledWith('otp-123', {
        attempts: 2,
      });
    });
  });

  describe('cleanupExpiredOTPs', () => {
    it('should clean up expired OTPs successfully', async () => {
      mockOTPVerificationModel.deleteExpired.mockResolvedValue();

      await OTPService.cleanupExpiredOTPs();

      expect(mockOTPVerificationModel.deleteExpired).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockOTPVerificationModel.deleteExpired.mockRejectedValue(new Error('Database error'));

      await expect(OTPService.cleanupExpiredOTPs()).resolves.not.toThrow();
    });
  });

  describe('getOTPStats', () => {
    it('should return OTP statistics', async () => {
      const mockData = [
        { verified: true },
        { verified: false },
        { verified: true },
        { verified: false },
      ];

      const mockSupabaseAdmin = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      require('../../lib/database').supabaseAdmin = mockSupabaseAdmin;

      const stats = await OTPService.getOTPStats('user-123');

      expect(stats).toEqual({
        totalSent: 4,
        totalVerified: 2,
        pendingVerification: 2,
      });
    });

    it('should return zero stats on error', async () => {
      const mockSupabaseAdmin = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      require('../../lib/database').supabaseAdmin = mockSupabaseAdmin;

      const stats = await OTPService.getOTPStats('user-123');

      expect(stats).toEqual({
        totalSent: 0,
        totalVerified: 0,
        pendingVerification: 0,
      });
    });
  });
});