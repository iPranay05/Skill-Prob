import { OTPVerificationModel } from '@/models/OTPVerification';
import { OTPVerification } from '@/types/user';

// Mock the database module
jest.mock('@/lib/database', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '@/lib/database';

describe('OTPVerificationModel', () => {
  const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;
  
  const mockOTPData: Omit<OTPVerification, 'id' | 'createdAt'> = {
    userId: 'user123',
    type: 'email',
    code: '123456',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    verified: false
  };

  const mockOTPVerification: OTPVerification = {
    id: 'otp123',
    ...mockOTPData,
    createdAt: new Date().toISOString()
  };

  // Helper function to create a chainable mock
  const createChainableMock = () => {
    const chain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };
    return chain;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create OTP verification successfully', async () => {
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: mockOTPVerification, error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.create(mockOTPData);

      expect(result).toEqual(mockOTPVerification);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('otp_verifications');
      expect(mockChain.insert).toHaveBeenCalledWith([mockOTPData]);
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should throw error when creation fails', async () => {
      const mockError = { message: 'Database error' };
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      await expect(OTPVerificationModel.create(mockOTPData))
        .rejects.toThrow('Failed to create OTP verification: Database error');
    });
  });

  describe('findById', () => {
    it('should find OTP verification by ID', async () => {
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: mockOTPVerification, error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.findById('otp123');

      expect(result).toEqual(mockOTPVerification);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('otp_verifications');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'otp123');
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should return null when OTP verification not found', async () => {
      const mockError = { code: 'PGRST116' }; // Not found error code
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error for database errors other than not found', async () => {
      const mockError = { message: 'Database connection error' };
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      await expect(OTPVerificationModel.findById('otp123'))
        .rejects.toThrow('Failed to find OTP verification: Database connection error');
    });
  });

  describe('findByUserIdAndType', () => {
    it('should find valid OTP by user ID, type, and code', async () => {
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: mockOTPVerification, error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.findByUserIdAndType('user123', 'email', '123456');

      expect(result).toEqual(mockOTPVerification);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('otp_verifications');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('userId', 'user123');
      expect(mockChain.eq).toHaveBeenCalledWith('type', 'email');
      expect(mockChain.eq).toHaveBeenCalledWith('code', '123456');
      expect(mockChain.eq).toHaveBeenCalledWith('verified', false);
      expect(mockChain.gt).toHaveBeenCalledWith('expiresAt', expect.any(String));
    });

    it('should return null when no matching OTP found', async () => {
      const mockError = { code: 'PGRST116' };
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.findByUserIdAndType('user123', 'email', 'wrong-code');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update OTP verification successfully', async () => {
      const updates = { verified: true };
      const updatedOTP = { ...mockOTPVerification, ...updates };

      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: updatedOTP, error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.update('otp123', updates);

      expect(result).toEqual(updatedOTP);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('otp_verifications');
      expect(mockChain.update).toHaveBeenCalledWith(updates);
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'otp123');
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      const mockError = { message: 'Update failed' };
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      await expect(OTPVerificationModel.update('otp123', { verified: true }))
        .rejects.toThrow('Failed to update OTP verification: Update failed');
    });
  });

  describe('markAsVerified', () => {
    it('should mark OTP as verified', async () => {
      const verifiedOTP = { ...mockOTPVerification, verified: true };

      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: verifiedOTP, error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.markAsVerified('otp123');

      expect(result).toEqual(verifiedOTP);
      expect(mockChain.update).toHaveBeenCalledWith({ verified: true });
    });
  });

  describe('deleteUnverifiedByUserAndType', () => {
    it('should delete unverified OTPs for user and type', async () => {
      const mockChain = createChainableMock();
      // Mock the final eq call to return the result
      mockChain.eq.mockImplementation((field, value) => {
        if (field === 'verified') {
          return Promise.resolve({ error: null });
        }
        return mockChain;
      });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      await OTPVerificationModel.deleteUnverifiedByUserAndType('user123', 'email');

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('otp_verifications');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('userId', 'user123');
      expect(mockChain.eq).toHaveBeenCalledWith('type', 'email');
      expect(mockChain.eq).toHaveBeenCalledWith('verified', false);
    });

    it('should throw error when deletion fails', async () => {
      const mockError = { message: 'Deletion failed' };
      const mockChain = createChainableMock();
      mockChain.eq.mockImplementation((field, value) => {
        if (field === 'verified') {
          return Promise.resolve({ error: mockError });
        }
        return mockChain;
      });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      await expect(OTPVerificationModel.deleteUnverifiedByUserAndType('user123', 'email'))
        .rejects.toThrow('Failed to delete unverified OTPs: Deletion failed');
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired OTPs', async () => {
      const mockChain = createChainableMock();
      mockChain.lt.mockResolvedValue({ error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      await OTPVerificationModel.deleteExpired();

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('otp_verifications');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.lt).toHaveBeenCalledWith('expiresAt', expect.any(String));
    });

    it('should throw error when deletion fails', async () => {
      const mockError = { message: 'Cleanup failed' };
      const mockChain = createChainableMock();
      mockChain.lt.mockResolvedValue({ error: mockError });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      await expect(OTPVerificationModel.deleteExpired())
        .rejects.toThrow('Failed to delete expired OTPs: Cleanup failed');
    });
  });

  describe('findValidOTP', () => {
    it('should find valid OTP with correct parameters', async () => {
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: mockOTPVerification, error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.findValidOTP('user123', 'email', '123456');

      expect(result).toEqual(mockOTPVerification);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('otp_verifications');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('userId', 'user123');
      expect(mockChain.eq).toHaveBeenCalledWith('type', 'email');
      expect(mockChain.eq).toHaveBeenCalledWith('code', '123456');
      expect(mockChain.eq).toHaveBeenCalledWith('verified', false);
      expect(mockChain.gt).toHaveBeenCalledWith('expiresAt', expect.any(String));
      expect(mockChain.order).toHaveBeenCalledWith('createdAt', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(1);
    });

    it('should return null when no valid OTP found', async () => {
      const mockError = { code: 'PGRST116' };
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.findValidOTP('user123', 'email', 'invalid-code');

      expect(result).toBeNull();
    });

    it('should handle phone type OTP verification', async () => {
      const phoneOTP = { ...mockOTPVerification, type: 'phone' as const };
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: phoneOTP, error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.findValidOTP('user123', 'phone', '123456');

      expect(result).toEqual(phoneOTP);
      expect(mockChain.eq).toHaveBeenCalledWith('type', 'phone');
    });

    it('should throw error for database errors other than not found', async () => {
      const mockError = { message: 'Database connection error' };
      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: null, error: mockError });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      await expect(OTPVerificationModel.findValidOTP('user123', 'email', '123456'))
        .rejects.toThrow('Failed to find valid OTP: Database connection error');
    });
  });

  describe('OTP Expiration Logic', () => {
    it('should correctly handle expired OTPs', async () => {
      const expiredOTP = {
        ...mockOTPVerification,
        expiresAt: new Date(Date.now() - 1000).toISOString() // 1 second ago
      };

      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.findValidOTP('user123', 'email', '123456');

      expect(result).toBeNull();
    });

    it('should correctly handle future expiration times', async () => {
      const futureOTP = {
        ...mockOTPVerification,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      };

      const mockChain = createChainableMock();
      mockChain.single.mockResolvedValue({ data: futureOTP, error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockChain as any);

      const result = await OTPVerificationModel.findValidOTP('user123', 'email', '123456');

      expect(result).toEqual(futureOTP);
    });
  });
});