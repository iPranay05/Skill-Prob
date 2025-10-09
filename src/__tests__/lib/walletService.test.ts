// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      })),
      order: jest.fn(() => ({
        range: jest.fn()
      })),
      gt: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn()
        }))
      }))
    })),
    rpc: jest.fn()
  }))
}));

import { walletService } from '@/lib/walletService';

describe('WalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    test('should create wallet for new user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const userType = 'student';

      // Mock no existing wallet
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful wallet creation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: {
          id: 'wallet-123',
          user_id: userId,
          user_type: userType,
          balance: { points: 0, credits: 0, currency: 'INR' }
        },
        error: null
      });

      const result = await walletService.createWallet(userId, userType);

      expect(result.success).toBe(true);
      expect(result.walletId).toBe('wallet-123');
      expect(result.balance).toEqual({ points: 0, credits: 0, currency: 'INR' });
    });

    test('should prevent duplicate wallet creation', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock existing wallet
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'existing-wallet' },
        error: null
      });

      const result = await walletService.createWallet(userId, 'student');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet already exists for this user');
    });
  });

  describe('getWallet', () => {
    test('should retrieve wallet with related data', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const mockWalletData = {
        id: 'wallet-123',
        user_id: userId,
        balance: { points: 100, credits: 500, currency: 'INR' },
        wallet_transactions: [],
        wallet_credits: []
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockWalletData,
        error: null
      });

      const result = await walletService.getWallet(userId);

      expect(result.success).toBe(true);
      expect(result.walletId).toBe('wallet-123');
      expect(result.balance).toEqual({ points: 100, credits: 500, currency: 'INR' });
    });

    test('should handle wallet not found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await walletService.getWallet(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet not found');
    });
  });

  describe('addTransaction', () => {
    test('should validate transaction configuration', async () => {
      const invalidConfig = {
        walletId: 'invalid-uuid',
        type: 'invalid' as any,
        amount: -100,
        description: ''
      };

      const result = await walletService.addTransaction(invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction failed');
    });

    test('should add transaction successfully', async () => {
      const validConfig = {
        walletId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'credit' as const,
        amount: 500,
        points: 10,
        description: 'Test transaction'
      };

      // Mock successful transaction addition
      mockSupabase.rpc.mockResolvedValue({
        data: 'transaction-123',
        error: null
      });

      // Mock updated wallet balance
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          balance: { points: 110, credits: 1000, currency: 'INR' }
        },
        error: null
      });

      const result = await walletService.addTransaction(validConfig);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('transaction-123');
      expect(result.balance).toEqual({ points: 110, credits: 1000, currency: 'INR' });
    });

    test('should handle transaction failure', async () => {
      const validConfig = {
        walletId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'credit' as const,
        amount: 500,
        description: 'Test transaction'
      };

      // Mock transaction failure
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Transaction failed' }
      });

      const result = await walletService.addTransaction(validConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to add transaction');
    });
  });

  describe('convertPointsToCredits', () => {
    test('should convert points to credits successfully', async () => {
      const walletId = '123e4567-e89b-12d3-a456-426614174000';
      const points = 100;
      const conversionRate = 0.1;

      // Mock current wallet balance
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          balance: { points: 150, credits: 500, currency: 'INR' }
        },
        error: null
      });

      // Mock successful transaction addition
      mockSupabase.rpc.mockResolvedValue({
        data: 'transaction-123',
        error: null
      });

      // Mock updated balance after conversion
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          balance: { points: 150, credits: 500, currency: 'INR' }
        },
        error: null
      }).mockResolvedValueOnce({
        data: {
          balance: { points: 50, credits: 510, currency: 'INR' }
        },
        error: null
      });

      const result = await walletService.convertPointsToCredits(walletId, points, conversionRate);

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_wallet_transaction', expect.objectContaining({
        wallet_uuid: walletId,
        trans_type: 'conversion',
        trans_amount: points * conversionRate,
        trans_points: -points
      }));
    });

    test('should prevent conversion with insufficient points', async () => {
      const walletId = '123e4567-e89b-12d3-a456-426614174000';
      const points = 200;

      // Mock wallet with insufficient points
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          balance: { points: 50, credits: 500, currency: 'INR' }
        },
        error: null
      });

      const result = await walletService.convertPointsToCredits(walletId, points);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient points');
    });
  });

  describe('addWalletCredit', () => {
    test('should add wallet credit successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const amount = 1000;
      const source = 'refund';

      // Mock wallet exists
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'wallet-123' },
        error: null
      });

      // Mock successful credit addition
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'credit-123' },
        error: null
      });

      // Mock successful transaction addition
      mockSupabase.rpc.mockResolvedValue({
        data: 'transaction-123',
        error: null
      });

      const result = await walletService.addWalletCredit(userId, amount, source);

      expect(result.success).toBe(true);
      expect(result.walletId).toBe('wallet-123');
    });

    test('should handle wallet not found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock wallet not found
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await walletService.addWalletCredit(userId, 1000, 'refund');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet not found');
    });
  });

  describe('useWalletCredits', () => {
    test('should use wallet credits successfully', async () => {
      const walletId = '123e4567-e89b-12d3-a456-426614174000';
      const amount = 500;

      // Mock successful credit usage
      mockSupabase.rpc.mockResolvedValue({
        data: 500, // Full amount used
        error: null
      });

      const result = await walletService.useWalletCredits(walletId, amount);

      expect(result.success).toBe(true);
      expect(result.walletId).toBe(walletId);
    });

    test('should handle insufficient credits', async () => {
      const walletId = '123e4567-e89b-12d3-a456-426614174000';
      const amount = 1000;

      // Mock insufficient credits
      mockSupabase.rpc.mockResolvedValue({
        data: 300, // Less than requested
        error: null
      });

      const result = await walletService.useWalletCredits(walletId, amount);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient wallet credits');
    });
  });

  describe('requestPayout', () => {
    test('should validate payout request', async () => {
      const invalidRequest = {
        ambassadorId: 'invalid-uuid',
        amount: -100,
        pointsToRedeem: -50
      };

      const result = await walletService.requestPayout(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payout request failed');
    });

    test('should create payout request successfully', async () => {
      const validRequest = {
        ambassadorId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 1000,
        pointsToRedeem: 10000,
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'TEST0001',
          accountHolderName: 'Test User',
          bankName: 'Test Bank'
        }
      };

      // Mock ambassador with wallet
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: validRequest.ambassadorId,
          wallets: [{
            id: 'wallet-123',
            balance: { points: 15000, credits: 500, currency: 'INR' }
          }]
        },
        error: null
      });

      // Mock successful payout request creation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'payout-123' },
        error: null
      });

      // Mock successful transaction addition
      mockSupabase.rpc.mockResolvedValue({
        data: 'transaction-123',
        error: null
      });

      const result = await walletService.requestPayout(validRequest);

      expect(result.success).toBe(true);
      expect(result.walletId).toBe('wallet-123');
    });

    test('should prevent payout with insufficient points', async () => {
      const validRequest = {
        ambassadorId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 1000,
        pointsToRedeem: 10000
      };

      // Mock ambassador with insufficient points
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: validRequest.ambassadorId,
          wallets: [{
            id: 'wallet-123',
            balance: { points: 5000, credits: 500, currency: 'INR' }
          }]
        },
        error: null
      });

      const result = await walletService.requestPayout(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient points for payout');
    });
  });

  describe('processPayoutRequest', () => {
    test('should approve payout request', async () => {
      const payoutRequestId = '123e4567-e89b-12d3-a456-426614174000';
      const adminId = 'admin-123';

      // Mock pending payout request
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: payoutRequestId,
          status: 'pending',
          wallet_id: 'wallet-123',
          points_redeemed: 1000
        },
        error: null
      });

      const result = await walletService.processPayoutRequest(
        payoutRequestId,
        true,
        adminId,
        'Approved by admin'
      );

      expect(result.success).toBe(true);
      expect(result.walletId).toBe('wallet-123');
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith(payoutRequestId);
    });

    test('should reject payout request and restore points', async () => {
      const payoutRequestId = '123e4567-e89b-12d3-a456-426614174000';
      const adminId = 'admin-123';

      // Mock pending payout request
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: payoutRequestId,
          status: 'pending',
          wallet_id: 'wallet-123',
          points_redeemed: 1000
        },
        error: null
      });

      // Mock successful transaction addition (points restoration)
      mockSupabase.rpc.mockResolvedValue({
        data: 'transaction-123',
        error: null
      });

      const result = await walletService.processPayoutRequest(
        payoutRequestId,
        false,
        adminId,
        'Rejected due to invalid bank details'
      );

      expect(result.success).toBe(true);
      expect(result.walletId).toBe('wallet-123');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_wallet_transaction', expect.objectContaining({
        trans_type: 'credit',
        trans_points: 1000
      }));
    });

    test('should prevent processing already processed request', async () => {
      const payoutRequestId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock already processed payout request
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: payoutRequestId,
          status: 'approved'
        },
        error: null
      });

      const result = await walletService.processPayoutRequest(
        payoutRequestId,
        true,
        'admin-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payout request already processed');
    });
  });

  describe('getTransactionHistory', () => {
    test('should retrieve transaction history with pagination', async () => {
      const walletId = '123e4567-e89b-12d3-a456-426614174000';
      const mockTransactions = [
        { id: 'tx-1', type: 'credit', amount: 100 },
        { id: 'tx-2', type: 'debit', amount: 50 }
      ];

      mockSupabase.from().select().eq().order().range.mockResolvedValue({
        data: mockTransactions,
        error: null
      });

      const result = await walletService.getTransactionHistory(walletId, 10, 0);

      expect(result).toEqual(mockTransactions);
      expect(mockSupabase.from().select().eq().order().range).toHaveBeenCalledWith(0, 9);
    });
  });

  describe('getAmbassadorEarnings', () => {
    test('should calculate ambassador earnings summary', async () => {
      const ambassadorId = '123e4567-e89b-12d3-a456-426614174000';

      const mockAmbassadorData = {
        id: ambassadorId,
        wallets: [{
          id: 'wallet-123',
          balance: { points: 1000, credits: 500, currency: 'INR' }
        }],
        payout_requests: [
          { status: 'processed', amount: '100' },
          { status: 'pending', amount: '50' }
        ],
        referrals: [
          { id: 'ref-1' },
          { id: 'ref-2' }
        ]
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockAmbassadorData,
        error: null
      });

      // Mock transaction history
      mockSupabase.from().select().eq().order().range.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await walletService.getAmbassadorEarnings(ambassadorId);

      expect(result).toBeDefined();
      expect(result.earnings.totalReferrals).toBe(2);
      expect(result.earnings.currentPoints).toBe(1000);
      expect(result.earnings.totalPaidOut).toBe(100);
      expect(result.earnings.pendingPayouts).toBe(50);
      expect(result.earnings.availableForPayout).toBe(100); // 1000 * 0.1
    });

    test('should handle ambassador not found', async () => {
      const ambassadorId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await walletService.getAmbassadorEarnings(ambassadorId);

      expect(result).toBeNull();
    });
  });
});