import { NextRequest } from 'next/server';
import { POST as applyPost } from '../../app/api/ambassadors/apply/route';
import { GET as dashboardGet } from '../../app/api/ambassadors/dashboard/route';
import { POST as payoutPost, GET as payoutGet } from '../../app/api/ambassadors/payout/route';
import { POST as trackPost, GET as trackGet } from '../../app/api/referrals/track/route';
import { AmbassadorService } from '../../lib/ambassadorService';
import { verifyToken } from '../../lib/auth';
import { UserRole } from '../../types/user';

// Mock dependencies
jest.mock('../../lib/ambassadorService');
jest.mock('../../lib/auth');

const mockAmbassadorService = AmbassadorService as jest.Mocked<typeof AmbassadorService>;
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

describe('Ambassador API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ambassadors/apply', () => {
    const validApplication = {
      motivation: 'I am passionate about education and want to help students discover great courses while earning rewards.',
      experience: 'I have 2 years of experience in digital marketing and social media management.',
      socialMedia: [
        { platform: 'Instagram', handle: '@testuser', followers: 5000 },
        { platform: 'Twitter', handle: '@testuser', followers: 2000 }
      ],
      expectedReferrals: 50,
      marketingStrategy: 'I will create engaging content about courses and share my learning journey.'
    };

    it('should create ambassador application successfully', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const mockAmbassador = {
        id: 'ambassador-123',
        referralCode: 'REF12345',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });
      mockAmbassadorService.applyForAmbassador.mockResolvedValue(mockAmbassador as any);

      const request = new NextRequest('http://localhost:3000/api/ambassadors/apply', {
        method: 'POST',
        body: JSON.stringify(validApplication),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await applyPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.referralCode).toBe('REF12345');
      expect(mockAmbassadorService.applyForAmbassador).toHaveBeenCalledWith(
        mockUser.userId,
        validApplication
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      mockVerifyToken.mockResolvedValue({ success: false, user: null });

      const request = new NextRequest('http://localhost:3000/api/ambassadors/apply', {
        method: 'POST',
        body: JSON.stringify(validApplication),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await applyPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for missing required fields', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });

      const invalidApplication = {
        motivation: '', // Too short
        experience: 'Short', // Too short
        socialMedia: [] // Empty array
      };

      const request = new NextRequest('http://localhost:3000/api/ambassadors/apply', {
        method: 'POST',
        body: JSON.stringify(invalidApplication),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await applyPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required fields');
    });

    it('should return 400 for invalid motivation length', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });

      const invalidApplication = {
        ...validApplication,
        motivation: 'Too short' // Less than 50 characters
      };

      const request = new NextRequest('http://localhost:3000/api/ambassadors/apply', {
        method: 'POST',
        body: JSON.stringify(invalidApplication),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await applyPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('50 and 1000 characters');
    });
  });

  describe('GET /api/ambassadors/dashboard', () => {
    it('should return dashboard data for ambassador', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.AMBASSADOR
      };

      const mockAmbassador = {
        id: 'ambassador-123',
        referralCode: 'REF12345',
        status: 'active'
      };

      const mockAnalytics = {
        analytics: {
          totalReferrals: 10,
          convertedReferrals: 3,
          conversionRate: 30,
          totalEarnings: 1500,
          monthlyReferrals: 5,
          currentPoints: 150,
          availableForPayout: 150,
          lifetimeEarnings: 1500
        }
      };

      const mockWallet = {
        id: 'wallet-123',
        balance: { points: 150, credits: 0, currency: 'INR' },
        totalEarned: 1500,
        totalWithdrawn: 0
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });
      mockAmbassadorService.getAmbassadorByUserId.mockResolvedValue(mockAmbassador as any);
      mockAmbassadorService.getAmbassadorAnalytics.mockResolvedValue(mockAnalytics as any);
      mockAmbassadorService.getWalletByUserId.mockResolvedValue(mockWallet as any);
      mockAmbassadorService.getReferralsByAmbassador.mockResolvedValue([]);
      mockAmbassadorService.getWalletTransactions.mockResolvedValue([]);
      mockAmbassadorService.getPayoutRequests.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/ambassadors/dashboard');

      const response = await dashboardGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.ambassador.referralCode).toBe('REF12345');
      expect(data.data.analytics.totalReferrals).toBe(10);
    });

    it('should return 403 for non-ambassador user', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });

      const request = new NextRequest('http://localhost:3000/api/ambassadors/dashboard');

      const response = await dashboardGet(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Ambassador role required');
    });
  });

  describe('POST /api/ambassadors/payout', () => {
    it('should create payout request successfully', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.AMBASSADOR
      };

      const mockAmbassador = {
        id: 'ambassador-123',
        payoutDetails: { verified: true }
      };

      const mockPayoutRequest = {
        id: 'payout-123',
        amount: 150,
        pointsRedeemed: 150,
        status: 'pending',
        requestedAt: new Date().toISOString()
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });
      mockAmbassadorService.getAmbassadorByUserId.mockResolvedValue(mockAmbassador as any);
      mockAmbassadorService.requestPayout.mockResolvedValue(mockPayoutRequest as any);

      const request = new NextRequest('http://localhost:3000/api/ambassadors/payout', {
        method: 'POST',
        body: JSON.stringify({ pointsToRedeem: 150, conversionRate: 1 }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await payoutPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.amount).toBe(150);
      expect(data.data.pointsRedeemed).toBe(150);
    });

    it('should return 400 for insufficient points', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.AMBASSADOR
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });

      const request = new NextRequest('http://localhost:3000/api/ambassadors/payout', {
        method: 'POST',
        body: JSON.stringify({ pointsToRedeem: 50 }), // Below minimum
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await payoutPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Minimum payout is 100 points');
    });
  });

  describe('POST /api/referrals/track', () => {
    it('should track referral registration successfully', async () => {
      const mockUser = {
        userId: 'student-123',
        email: 'student@example.com',
        role: UserRole.STUDENT
      };

      const mockAmbassador = {
        id: 'ambassador-123',
        referralCode: 'REF12345',
        status: 'active'
      };

      const mockReferral = {
        id: 'referral-123',
        referralCode: 'REF12345',
        status: 'pending',
        registrationDate: new Date().toISOString()
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });
      mockAmbassadorService.getAmbassadorByReferralCode.mockResolvedValue(mockAmbassador as any);
      mockAmbassadorService.processReferralRegistration.mockResolvedValue(mockReferral as any);

      const request = new NextRequest('http://localhost:3000/api/referrals/track', {
        method: 'POST',
        body: JSON.stringify({
          referralCode: 'REF12345',
          sourceData: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' }
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await trackPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.referralId).toBe('referral-123');
      expect(data.data.ambassadorCode).toBe('REF12345');
    });

    it('should return 400 for invalid referral code', async () => {
      const mockUser = {
        userId: 'student-123',
        email: 'student@example.com',
        role: UserRole.STUDENT
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });
      mockAmbassadorService.getAmbassadorByReferralCode.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/referrals/track', {
        method: 'POST',
        body: JSON.stringify({ referralCode: 'INVALID123' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await trackPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid or inactive referral code');
    });
  });

  describe('GET /api/referrals/track', () => {
    it('should validate referral code successfully', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      const mockAmbassador = {
        id: 'ambassador-123',
        referralCode: 'REF12345',
        status: 'active'
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });
      mockAmbassadorService.getAmbassadorByReferralCode.mockResolvedValue(mockAmbassador as any);

      const request = new NextRequest('http://localhost:3000/api/referrals/track?code=REF12345');

      const response = await trackGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
      expect(data.data.ambassadorCode).toBe('REF12345');
    });

    it('should return 400 for missing referral code', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });

      const request = new NextRequest('http://localhost:3000/api/referrals/track');

      const response = await trackGet(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Referral code is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.AMBASSADOR
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });
      mockAmbassadorService.getAmbassadorByUserId.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/ambassadors/dashboard');

      const response = await dashboardGet(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle validation errors in payout request', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.AMBASSADOR
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });

      const request = new NextRequest('http://localhost:3000/api/ambassadors/payout', {
        method: 'POST',
        body: JSON.stringify({ pointsToRedeem: -10 }), // Invalid negative value
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await payoutPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid points amount');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all protected endpoints', async () => {
      mockVerifyToken.mockResolvedValue({ success: false, user: null });

      const endpoints = [
        { method: 'POST', path: '/api/ambassadors/apply', handler: applyPost },
        { method: 'GET', path: '/api/ambassadors/dashboard', handler: dashboardGet },
        { method: 'POST', path: '/api/ambassadors/payout', handler: payoutPost },
        { method: 'POST', path: '/api/referrals/track', handler: trackPost }
      ];

      for (const endpoint of endpoints) {
        const request = new NextRequest(`http://localhost:3000${endpoint.path}`, {
          method: endpoint.method,
          body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined,
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await endpoint.handler(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Unauthorized');
      }
    });

    it('should enforce ambassador role for ambassador-specific endpoints', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.STUDENT // Not an ambassador
      };

      mockVerifyToken.mockResolvedValue({ success: true, user: mockUser });

      const ambassadorEndpoints = [
        { method: 'GET', path: '/api/ambassadors/dashboard', handler: dashboardGet },
        { method: 'POST', path: '/api/ambassadors/payout', handler: payoutPost }
      ];

      for (const endpoint of ambassadorEndpoints) {
        const request = new NextRequest(`http://localhost:3000${endpoint.path}`, {
          method: endpoint.method,
          body: endpoint.method === 'POST' ? JSON.stringify({ pointsToRedeem: 100 }) : undefined,
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await endpoint.handler(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Ambassador role required');
      }
    });
  });
});