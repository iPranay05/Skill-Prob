import { AuthService } from '@/lib/auth';
import { UserRole } from '@/types/user';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock the database module
jest.mock('@/lib/database', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

import { redis } from '@/lib/database';

describe('AuthService', () => {
  const mockRedis = redis as jest.Mocked<typeof redis>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-purposes-only';
  });

  describe('Password Management', () => {
    describe('hashPassword', () => {
      it('should hash password with bcrypt', async () => {
        const password = 'testPassword123';
        const hashedPassword = await AuthService.hashPassword(password);
        
        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.length).toBeGreaterThan(50);
      });

      it('should generate different hashes for same password', async () => {
        const password = 'testPassword123';
        const hash1 = await AuthService.hashPassword(password);
        const hash2 = await AuthService.hashPassword(password);
        
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const password = 'testPassword123';
        const hashedPassword = await AuthService.hashPassword(password);
        
        const isValid = await AuthService.comparePassword(password, hashedPassword);
        expect(isValid).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const password = 'testPassword123';
        const wrongPassword = 'wrongPassword456';
        const hashedPassword = await AuthService.hashPassword(password);
        
        const isValid = await AuthService.comparePassword(wrongPassword, hashedPassword);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('JWT Token Management', () => {
    const mockPayload = {
      userId: 'user123',
      email: 'test@example.com',
      role: UserRole.STUDENT
    };

    describe('generateTokens', () => {
      it('should generate access and refresh tokens', () => {
        const tokens = AuthService.generateTokens(mockPayload);
        
        expect(tokens).toHaveProperty('accessToken');
        expect(tokens).toHaveProperty('refreshToken');
        expect(typeof tokens.accessToken).toBe('string');
        expect(typeof tokens.refreshToken).toBe('string');
      });

      it('should throw error when JWT secrets are missing', () => {
        delete process.env.JWT_SECRET;
        
        expect(() => {
          AuthService.generateTokens(mockPayload);
        }).toThrow('JWT secrets are not configured');
      });

      it('should generate valid JWT tokens', () => {
        const tokens = AuthService.generateTokens(mockPayload);
        
        // Verify access token
        const accessPayload = jwt.verify(tokens.accessToken, process.env.JWT_SECRET!) as any;
        expect(accessPayload.userId).toBe(mockPayload.userId);
        expect(accessPayload.email).toBe(mockPayload.email);
        expect(accessPayload.role).toBe(mockPayload.role);
        
        // Verify refresh token
        const refreshPayload = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
        expect(refreshPayload.userId).toBe(mockPayload.userId);
      });
    });

    describe('verifyAccessToken', () => {
      it('should verify valid access token', async () => {
        const tokens = AuthService.generateTokens(mockPayload);
        
        const payload = await AuthService.verifyAccessToken(tokens.accessToken);
        
        expect(payload.userId).toBe(mockPayload.userId);
        expect(payload.email).toBe(mockPayload.email);
        expect(payload.role).toBe(mockPayload.role);
      });

      it('should throw error for invalid token', async () => {
        const invalidToken = 'invalid.token.here';
        
        await expect(AuthService.verifyAccessToken(invalidToken))
          .rejects.toThrow('Invalid or expired access token');
      });

      it('should throw error when JWT secret is missing', async () => {
        // First generate tokens with secret present
        const tokens = AuthService.generateTokens(mockPayload);
        
        // Then delete the secret and try to verify
        delete process.env.JWT_SECRET;
        
        await expect(AuthService.verifyAccessToken(tokens.accessToken))
          .rejects.toThrow('JWT secret is not configured');
          
        // Restore the secret for other tests
        process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
      });

      it('should throw error for expired token', async () => {
        // Generate token with very short expiry
        const expiredToken = jwt.sign(mockPayload, process.env.JWT_SECRET!, { expiresIn: '1ms' });
        
        // Wait for token to expire
        await new Promise(resolve => setTimeout(resolve, 10));
        
        await expect(AuthService.verifyAccessToken(expiredToken))
          .rejects.toThrow('Invalid or expired access token');
      });
    });

    describe('verifyRefreshToken', () => {
      beforeEach(() => {
        mockRedis.get.mockClear();
      });

      it('should verify valid refresh token', async () => {
        const tokens = AuthService.generateTokens(mockPayload);
        mockRedis.get.mockResolvedValue(tokens.refreshToken);
        
        const payload = await AuthService.verifyRefreshToken(tokens.refreshToken);
        
        expect(payload.userId).toBe(mockPayload.userId);
        expect(mockRedis.get).toHaveBeenCalledWith(`refresh_token:${mockPayload.userId}`);
      });

      it('should throw error when token not found in Redis', async () => {
        const tokens = AuthService.generateTokens(mockPayload);
        mockRedis.get.mockResolvedValue(null);
        
        await expect(AuthService.verifyRefreshToken(tokens.refreshToken))
          .rejects.toThrow('Invalid or expired refresh token');
      });

      it('should throw error when stored token does not match', async () => {
        const tokens = AuthService.generateTokens(mockPayload);
        mockRedis.get.mockResolvedValue('different-token');
        
        await expect(AuthService.verifyRefreshToken(tokens.refreshToken))
          .rejects.toThrow('Invalid or expired refresh token');
      });

      it('should throw error for invalid refresh token', async () => {
        const invalidToken = 'invalid.refresh.token';
        
        await expect(AuthService.verifyRefreshToken(invalidToken))
          .rejects.toThrow('Invalid or expired refresh token');
      });
    });

    describe('storeRefreshToken', () => {
      it('should store refresh token in Redis with expiry', async () => {
        const userId = 'user123';
        const refreshToken = 'refresh-token-123';
        
        await AuthService.storeRefreshToken(userId, refreshToken);
        
        expect(mockRedis.setex).toHaveBeenCalledWith(
          `refresh_token:${userId}`,
          7 * 24 * 60 * 60, // 7 days in seconds
          refreshToken
        );
      });
    });

    describe('revokeRefreshToken', () => {
      it('should delete refresh token from Redis', async () => {
        const userId = 'user123';
        
        await AuthService.revokeRefreshToken(userId);
        
        expect(mockRedis.del).toHaveBeenCalledWith(`refresh_token:${userId}`);
      });
    });

    describe('refreshAccessToken', () => {
      it('should generate new tokens when refresh token is valid', async () => {
        const tokens = AuthService.generateTokens(mockPayload);
        mockRedis.get.mockResolvedValue(tokens.refreshToken);
        mockRedis.setex.mockResolvedValue('OK');
        
        const newTokens = await AuthService.refreshAccessToken(tokens.refreshToken);
        
        expect(newTokens).toHaveProperty('accessToken');
        expect(newTokens).toHaveProperty('refreshToken');
        expect(typeof newTokens.accessToken).toBe('string');
        expect(typeof newTokens.refreshToken).toBe('string');
        
        // Verify the tokens are valid JWTs
        expect(() => jwt.decode(newTokens.accessToken)).not.toThrow();
        expect(() => jwt.decode(newTokens.refreshToken)).not.toThrow();
        
        // Verify new refresh token is stored
        expect(mockRedis.setex).toHaveBeenCalledWith(
          `refresh_token:${mockPayload.userId}`,
          7 * 24 * 60 * 60,
          newTokens.refreshToken
        );
      });

      it('should throw error when refresh token is invalid', async () => {
        const invalidToken = 'invalid-refresh-token';
        
        await expect(AuthService.refreshAccessToken(invalidToken))
          .rejects.toThrow('Invalid or expired refresh token');
      });
    });
  });

  describe('OTP Generation', () => {
    describe('generateOTP', () => {
      it('should generate 6-digit OTP', () => {
        const otp = AuthService.generateOTP();
        
        expect(otp).toMatch(/^\d{6}$/);
        expect(otp.length).toBe(6);
        expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
        expect(parseInt(otp)).toBeLessThanOrEqual(999999);
      });

      it('should generate different OTPs on multiple calls', () => {
        const otp1 = AuthService.generateOTP();
        const otp2 = AuthService.generateOTP();
        const otp3 = AuthService.generateOTP();
        
        // While theoretically possible to get same OTP, it's extremely unlikely
        expect(new Set([otp1, otp2, otp3]).size).toBeGreaterThan(1);
      });

      it('should generate numeric string', () => {
        const otp = AuthService.generateOTP();
        
        expect(typeof otp).toBe('string');
        expect(isNaN(Number(otp))).toBe(false);
      });
    });
  });

  describe('Referral Code Generation', () => {
    describe('generateReferralCode', () => {
      it('should generate referral code from first and last name', () => {
        const firstName = 'John';
        const lastName = 'Doe';
        
        const referralCode = AuthService.generateReferralCode(firstName, lastName);
        
        expect(referralCode).toMatch(/^JO[A-Z]{2}\d{4}$/);
        expect(referralCode.startsWith('JO')).toBe(true);
        expect(referralCode.length).toBe(8);
      });

      it('should handle short names', () => {
        const firstName = 'A';
        const lastName = 'B';
        
        const referralCode = AuthService.generateReferralCode(firstName, lastName);
        
        expect(referralCode).toMatch(/^AB\d{4}$/);
        expect(referralCode.length).toBe(6);
      });

      it('should generate different codes for same name', () => {
        const firstName = 'John';
        const lastName = 'Doe';
        
        const code1 = AuthService.generateReferralCode(firstName, lastName);
        const code2 = AuthService.generateReferralCode(firstName, lastName);
        
        expect(code1).not.toBe(code2);
        expect(code1.substring(0, 4)).toBe(code2.substring(0, 4)); // Same name part
        expect(code1.substring(4)).not.toBe(code2.substring(4)); // Different number part
      });

      it('should return uppercase code', () => {
        const firstName = 'john';
        const lastName = 'doe';
        
        const referralCode = AuthService.generateReferralCode(firstName, lastName);
        
        expect(referralCode).toBe(referralCode.toUpperCase());
      });
    });
  });
});