import { AmbassadorService } from '../../lib/ambassadorService';
import { supabaseAdmin } from '../../lib/database';
import { 
  AmbassadorStatus, 
  TransactionType, 
  PayoutStatus, 
  ReferralEventType,
  AmbassadorApplication 
} from '../../models/Ambassador';

// Mock the database
jest.mock('../../lib/database', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('AmbassadorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applyForAmbassador', () => {
    const mockApplication: AmbassadorApplication = {
      motivation: 'I want to help students learn and earn rewards for my efforts in promoting quality education.',
      experience: 'I have 3 years of experience in digital marketing and social media management.',
      socialMedia: [
        { platform: 'Instagram', handle: '@testuser', followers: 5000 },
        { platform: 'Twitter', handle: '@testuser', followers: 2000 }
      ],
      expectedReferrals: 50,
      marketingStrategy: 'I will use my social media presence to promote courses through engaging content.'
    };

    it('should create ambassador application successfully', async () => {
      const userId = 'user-123';
      const mockReferralCode = 'REF12345';
      const mockAmbassador = {
        id: 'ambassador-123',
        user_id: userId,
        referral_code: mockReferralCode,
        status: AmbassadorStatus.PENDING,
        application: mockApplication,
        created_at: new Date().toISOString()
      };

      // Mock existing ambassador check
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      // Mock referral code generation
      mockSupabaseAdmin.rpc.mockResolvedValueOnce({ data: mockReferralCode, error: null });

      // Mock ambassador creation
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockAmbassador, error: null })
          })
        })
      } as any);

      // Mock wallet creation
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { id: 'wallet-123', user_id: userId }, 
              error: null 
            })
          })
        })
      } as any);

      const result = await AmbassadorService.applyForAmbassador(userId, mockApplication);

      expect(result).toEqual(mockAmbassador);
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('generate_referral_code');
    });

    it('should throw error if user already has application', async () => {
      const userId = 'user-123';
      const existingAmbassador = { id: 'ambassador-123' };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingAmbassador, error: null })
          })
        })
      } as any);

      await expect(
        AmbassadorService.applyForAmbassador(userId, mockApplication)
      ).rejects.toThrow('User already has an ambassador application');
    });

    it('should throw error if referral code generation fails', async () => {
      const userId = 'user-123';

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      mockSupabaseAdmin.rpc.mockResolvedValueOnce({ data: null, error: null });

      await expect(
        AmbassadorService.applyForAmbassador(userId, mockApplication)
      ).rejects.toThrow('Failed to generate referral code');
    });
  });

  describe('approveAmbassador', () => {
    it('should approve ambassador successfully', async () => {
      const ambassadorId = 'ambassador-123';
      const reviewedBy = 'admin-123';
      const notes = 'Great application with strong social media presence';
      
      const mockApprovedAmbassador = {
        id: ambassadorId,
        status: AmbassadorStatus.ACTIVE,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        review_notes: notes
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockApprovedAmbassador, error: null })
            })
          })
        })
      } as any);

      const result = await AmbassadorService.approveAmbassador(ambassadorId, reviewedBy, notes);

      expect(result).toEqual(mockApprovedAmbassador);
      expect(result.status).toBe(AmbassadorStatus.ACTIVE);
    });
  });

  describe('rejectAmbassador', () => {
    it('should reject ambassador successfully', async () => {
      const ambassadorId = 'ambassador-123';
      const reviewedBy = 'admin-123';
      const reason = 'Insufficient social media following';
      
      const mockRejectedAmbassador = {
        id: ambassadorId,
        status: AmbassadorStatus.REJECTED,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        review_notes: reason
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockRejectedAmbassador, error: null })
            })
          })
        })
      } as any);

      const result = await AmbassadorService.rejectAmbassador(ambassadorId, reviewedBy, reason);

      expect(result).toEqual(mockRejectedAmbassador);
      expect(result.status).toBe(AmbassadorStatus.REJECTED);
    });
  });

  describe('getAmbassadorByReferralCode', () => {
    it('should return ambassador for valid active referral code', async () => {
      const referralCode = 'REF12345';
      const mockAmbassador = {
        id: 'ambassador-123',
        referral_code: referralCode,
        status: AmbassadorStatus.ACTIVE
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockAmbassador, error: null })
            })
          })
        })
      } as any);

      const result = await AmbassadorService.getAmbassadorByReferralCode(referralCode);

      expect(result).toEqual(mockAmbassador);
    });

    it('should return null for invalid referral code', async () => {
      const referralCode = 'INVALID123';

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      } as any);

      const result = await AmbassadorService.getAmbassadorByReferralCode(referralCode);

      expect(result).toBeNull();
    });
  });

  describe('createWallet', () => {
    it('should create wallet successfully', async () => {
      const userId = 'user-123';
      const userType = 'ambassador';
      const mockWallet = {
        id: 'wallet-123',
        user_id: userId,
        user_type: userType,
        balance: { points: 0, credits: 0, currency: 'INR' },
        total_earned: 0,
        total_spent: 0,
        total_withdrawn: 0
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockWallet, error: null })
          })
        })
      } as any);

      const result = await AmbassadorService.createWallet(userId, userType);

      expect(result).toEqual(mockWallet);
    });
  });

  describe('addWalletTransaction', () => {
    it('should add wallet transaction successfully', async () => {
      const walletId = 'wallet-123';
      const transactionId = 'transaction-123';
      const mockTransaction = {
        id: transactionId,
        wallet_id: walletId,
        type: TransactionType.REFERRAL_BONUS,
        amount: 0,
        points: 10,
        description: 'Registration referral bonus',
        balance_after: { points: 10, credits: 0, currency: 'INR' },
        created_at: new Date().toISOString()
      };

      mockSupabaseAdmin.rpc.mockResolvedValueOnce({ data: transactionId, error: null });
      
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTransaction, error: null })
          })
        })
      } as any);

      const result = await AmbassadorService.addWalletTransaction(
        walletId,
        TransactionType.REFERRAL_BONUS,
        0,
        10,
        'Registration referral bonus'
      );

      expect(result).toEqual(mockTransaction);
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('add_wallet_transaction', {
        wallet_uuid: walletId,
        trans_type: TransactionType.REFERRAL_BONUS,
        trans_amount: 0,
        trans_points: 10,
        trans_description: 'Registration referral bonus',
        reference: undefined,
        trans_metadata: {}
      });
    });
  });

  describe('processReferralRegistration', () => {
    it('should process referral registration successfully', async () => {
      const referralCode = 'REF12345';
      const studentId = 'student-123';
      const referralId = 'referral-123';
      const sourceData = { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' };
      
      const mockReferral = {
        id: referralId,
        ambassador_id: 'ambassador-123',
        student_id: studentId,
        referral_code: referralCode,
        registration_date: new Date().toISOString(),
        status: 'pending'
      };

      mockSupabaseAdmin.rpc.mockResolvedValueOnce({ data: referralId, error: null });
      
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockReferral, error: null })
          })
        })
      } as any);

      const result = await AmbassadorService.processReferralRegistration(
        referralCode,
        studentId,
        sourceData
      );

      expect(result).toEqual(mockReferral);
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('process_referral_registration', {
        referral_code_param: referralCode,
        student_uuid: studentId,
        source_metadata: sourceData
      });
    });
  });

  describe('addConversionEvent', () => {
    it('should add conversion event and award points', async () => {
      const referralId = 'referral-123';
      const eventType = ReferralEventType.FIRST_PURCHASE;
      const value = 1000;
      const metadata = { courseId: 'course-123' };

      const mockReferral = {
        id: referralId,
        conversion_events: [],
        ambassadors: {
          id: 'ambassador-123',
          user_id: 'user-123',
          performance: {
            totalReferrals: 5,
            successfulConversions: 2,
            totalEarnings: 500,
            currentPoints: 100,
            lifetimePoints: 150
          }
        }
      };

      const mockPointConfig = {
        event_type: eventType,
        points_awarded: 50,
        is_active: true
      };

      const mockWallet = { id: 'wallet-123' };

      // Mock referral fetch
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockReferral, error: null })
          })
        })
      } as any);

      // Mock point configuration fetch
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockPointConfig, error: null })
            })
          })
        })
      } as any);

      // Mock referral update
      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      } as any);

      // Mock wallet fetch
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockWallet, error: null })
          })
        })
      } as any);

      // Mock wallet transaction
      mockSupabaseAdmin.rpc.mockResolvedValueOnce({ data: 'transaction-123', error: null });
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: {}, error: null })
          })
        })
      } as any);

      // Mock ambassador performance update
      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      } as any);

      await AmbassadorService.addConversionEvent(referralId, eventType, value, metadata);

      // Verify referral was updated with conversion event
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('referrals');
    });
  });

  describe('requestPayout', () => {
    it('should create payout request successfully', async () => {
      const ambassadorId = 'ambassador-123';
      const pointsToRedeem = 100;
      const conversionRate = 1;
      const payoutAmount = pointsToRedeem * conversionRate;

      const mockAmbassador = {
        id: ambassadorId,
        wallets: {
          id: 'wallet-123',
          balance: { points: 150, credits: 0, currency: 'INR' }
        }
      };

      const mockPayoutRequest = {
        id: 'payout-123',
        ambassador_id: ambassadorId,
        wallet_id: 'wallet-123',
        amount: payoutAmount,
        points_redeemed: pointsToRedeem,
        status: PayoutStatus.PENDING
      };

      // Mock ambassador fetch
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockAmbassador, error: null })
          })
        })
      } as any);

      // Mock payout request creation
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPayoutRequest, error: null })
          })
        })
      } as any);

      // Mock wallet transaction
      mockSupabaseAdmin.rpc.mockResolvedValueOnce({ data: 'transaction-123', error: null });
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: {}, error: null })
          })
        })
      } as any);

      const result = await AmbassadorService.requestPayout(ambassadorId, pointsToRedeem, conversionRate);

      expect(result).toEqual(mockPayoutRequest);
    });

    it('should throw error for insufficient points', async () => {
      const ambassadorId = 'ambassador-123';
      const pointsToRedeem = 200;

      const mockAmbassador = {
        id: ambassadorId,
        wallets: {
          id: 'wallet-123',
          balance: { points: 50, credits: 0, currency: 'INR' }
        }
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockAmbassador, error: null })
          })
        })
      } as any);

      await expect(
        AmbassadorService.requestPayout(ambassadorId, pointsToRedeem)
      ).rejects.toThrow('Insufficient points for payout');
    });
  });

  describe('processPayoutRequest', () => {
    it('should approve payout request successfully', async () => {
      const payoutRequestId = 'payout-123';
      const processedBy = 'admin-123';
      const transactionId = 'txn-123';
      const notes = 'Payout processed successfully';

      const mockProcessedPayout = {
        id: payoutRequestId,
        status: PayoutStatus.PROCESSED,
        processed_at: new Date().toISOString(),
        processed_by: processedBy,
        transaction_id: transactionId,
        admin_notes: notes
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockProcessedPayout, error: null })
            })
          })
        })
      } as any);

      const result = await AmbassadorService.processPayoutRequest(
        payoutRequestId,
        processedBy,
        true,
        transactionId,
        notes
      );

      expect(result).toEqual(mockProcessedPayout);
      expect(result.status).toBe(PayoutStatus.PROCESSED);
    });

    it('should reject payout request and refund points', async () => {
      const payoutRequestId = 'payout-123';
      const processedBy = 'admin-123';
      const reason = 'Invalid bank details';

      const mockRejectedPayout = {
        id: payoutRequestId,
        wallet_id: 'wallet-123',
        points_redeemed: 100,
        status: PayoutStatus.REJECTED,
        processed_at: new Date().toISOString(),
        processed_by: processedBy,
        rejection_reason: reason
      };

      // Mock payout update
      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockRejectedPayout, error: null })
            })
          })
        })
      } as any);

      // Mock refund transaction
      mockSupabaseAdmin.rpc.mockResolvedValueOnce({ data: 'transaction-123', error: null });
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: {}, error: null })
          })
        })
      } as any);

      const result = await AmbassadorService.processPayoutRequest(
        payoutRequestId,
        processedBy,
        false,
        undefined,
        reason
      );

      expect(result.status).toBe(PayoutStatus.REJECTED);
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('add_wallet_transaction', 
        expect.objectContaining({
          trans_type: TransactionType.CREDIT,
          trans_points: 100
        })
      );
    });
  });

  describe('getAmbassadorAnalytics', () => {
    it('should calculate analytics correctly', async () => {
      const ambassadorId = 'ambassador-123';
      const mockAmbassador = {
        id: ambassadorId,
        referrals: [
          {
            id: 'ref-1',
            status: 'converted',
            registration_date: new Date().toISOString(),
            conversion_events: [
              { type: 'first_purchase', value: 500, pointsEarned: 50 }
            ]
          },
          {
            id: 'ref-2',
            status: 'pending',
            registration_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            conversion_events: []
          },
          {
            id: 'ref-3',
            status: 'converted',
            registration_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
            conversion_events: [
              { type: 'first_purchase', value: 300, pointsEarned: 30 }
            ]
          }
        ],
        wallets: {
          id: 'wallet-123',
          balance: { points: 80, credits: 0, currency: 'INR' },
          total_earned: 800
        }
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockAmbassador, error: null })
          })
        })
      } as any);

      const result = await AmbassadorService.getAmbassadorAnalytics(ambassadorId);

      expect(result.analytics).toEqual({
        totalReferrals: 3,
        convertedReferrals: 2,
        conversionRate: (2/3) * 100, // 66.67%
        totalEarnings: 800, // 500 + 300
        monthlyReferrals: 2, // ref-1 and ref-2 are within last month (ref-1 is current, ref-2 is 15 days ago)
        currentPoints: 80,
        availableForPayout: 80,
        lifetimeEarnings: 800
      });
    });
  });
});