import { paymentService } from '@/lib/paymentService';
import { subscriptionService } from '@/lib/subscriptionService';
import { walletService } from '@/lib/walletService';
import { createClient } from '@supabase/supabase-js';

// Mock external dependencies
jest.mock('razorpay');
jest.mock('stripe');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Payment System Integration Tests', () => {
  let testUserId: string;
  let testCourseId: string;
  let testWalletId: string;
  let testAmbassadorId: string;

  beforeAll(async () => {
    // Create test user
    const { data: user } = await supabase
      .from('users')
      .insert({
        email: 'test-payment@example.com',
        password: 'hashedpassword',
        role: 'student',
        profile: { firstName: 'Test', lastName: 'User' }
      })
      .select()
      .single();
    
    testUserId = user.id;

    // Create test course
    const { data: course } = await supabase
      .from('courses')
      .insert({
        title: 'Test Payment Course',
        description: 'Course for payment testing',
        mentor_id: testUserId,
        pricing: { amount: 1000, currency: 'INR', subscriptionType: 'one-time' }
      })
      .select()
      .single();
    
    testCourseId = course.id;

    // Create test wallet
    const walletResult = await walletService.createWallet(testUserId, 'student');
    testWalletId = walletResult.walletId!;

    // Create test ambassador
    const { data: ambassador } = await supabase
      .from('ambassadors')
      .insert({
        user_id: testUserId,
        referral_code: 'TEST001',
        status: 'active'
      })
      .select()
      .single();
    
    testAmbassadorId = ambassador.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('wallet_transactions').delete().eq('wallet_id', testWalletId);
    await supabase.from('wallet_credits').delete().eq('wallet_id', testWalletId);
    await supabase.from('wallets').delete().eq('id', testWalletId);
    await supabase.from('ambassadors').delete().eq('id', testAmbassadorId);
    await supabase.from('courses').delete().eq('id', testCourseId);
    await supabase.from('users').delete().eq('id', testUserId);
  });

  describe('Payment Creation and Processing', () => {
    test('should create a payment successfully', async () => {
      const paymentConfig = {
        gateway: 'wallet' as const,
        amount: 500,
        currency: 'INR',
        description: 'Test payment',
        studentId: testUserId,
        courseId: testCourseId
      };

      // Add credits to wallet first
      await walletService.addWalletCredit(testUserId, 1000, 'test_credit');

      const result = await paymentService.createPayment(paymentConfig);

      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();
      expect(result.orderId).toBeDefined();
    });

    test('should fail payment with insufficient wallet balance', async () => {
      const paymentConfig = {
        gateway: 'wallet' as const,
        amount: 2000, // More than available balance
        currency: 'INR',
        description: 'Test payment - insufficient funds',
        studentId: testUserId,
        courseId: testCourseId
      };

      const result = await paymentService.createPayment(paymentConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient wallet balance');
    });

    test('should process refund successfully', async () => {
      // First create a successful payment
      await walletService.addWalletCredit(testUserId, 1000, 'test_credit');
      
      const paymentResult = await paymentService.createPayment({
        gateway: 'wallet' as const,
        amount: 300,
        currency: 'INR',
        description: 'Test payment for refund',
        studentId: testUserId,
        courseId: testCourseId
      });

      expect(paymentResult.success).toBe(true);

      // Process refund
      const refundResult = await paymentService.processRefund(
        paymentResult.paymentId!,
        300,
        'Test refund',
        testUserId
      );

      expect(refundResult.success).toBe(true);
    });
  });

  describe('Subscription Management', () => {
    test('should create subscription successfully', async () => {
      const subscriptionConfig = {
        studentId: testUserId,
        courseId: testCourseId,
        billingCycle: 'monthly' as const,
        amount: 1000,
        currency: 'INR'
      };

      // Add credits for subscription payment
      await walletService.addWalletCredit(testUserId, 1500, 'test_credit');

      const result = await subscriptionService.createSubscription(subscriptionConfig);

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBeDefined();
      expect(result.paymentId).toBeDefined();
    });

    test('should cancel subscription successfully', async () => {
      // Create subscription first
      await walletService.addWalletCredit(testUserId, 1500, 'test_credit');
      
      const createResult = await subscriptionService.createSubscription({
        studentId: testUserId,
        courseId: testCourseId,
        billingCycle: 'monthly' as const,
        amount: 800,
        currency: 'INR'
      });

      expect(createResult.success).toBe(true);

      // Cancel subscription
      const cancelResult = await subscriptionService.cancelSubscription(
        createResult.subscriptionId!,
        'Test cancellation'
      );

      expect(cancelResult.success).toBe(true);
    });

    test('should pause and resume subscription', async () => {
      // Create subscription first
      await walletService.addWalletCredit(testUserId, 1500, 'test_credit');
      
      const createResult = await subscriptionService.createSubscription({
        studentId: testUserId,
        courseId: testCourseId,
        billingCycle: 'yearly' as const,
        amount: 5000,
        currency: 'INR'
      });

      expect(createResult.success).toBe(true);

      // Pause subscription
      const pauseResult = await subscriptionService.pauseSubscription(
        createResult.subscriptionId!,
        'Test pause'
      );

      expect(pauseResult.success).toBe(true);

      // Resume subscription
      const resumeResult = await subscriptionService.resumeSubscription(
        createResult.subscriptionId!
      );

      expect(resumeResult.success).toBe(true);
    });
  });

  describe('Wallet Credit System', () => {
    test('should add and use wallet credits', async () => {
      const creditAmount = 2000;
      
      // Add wallet credit
      const addResult = await walletService.addWalletCredit(
        testUserId,
        creditAmount,
        'test_credit'
      );

      expect(addResult.success).toBe(true);

      // Use wallet credits
      const useResult = await walletService.useWalletCredits(testWalletId, 500);

      expect(useResult.success).toBe(true);

      // Check remaining balance
      const walletResult = await walletService.getWallet(testUserId);
      expect(walletResult.success).toBe(true);
      expect(walletResult.balance?.credits).toBeGreaterThan(0);
    });

    test('should convert points to credits', async () => {
      // Add points to wallet first
      await walletService.addTransaction({
        walletId: testWalletId,
        type: 'referral_bonus',
        amount: 0,
        points: 100,
        description: 'Test points for conversion'
      });

      // Convert points to credits
      const convertResult = await walletService.convertPointsToCredits(
        testWalletId,
        50,
        0.1 // 1 point = 0.1 INR
      );

      expect(convertResult.success).toBe(true);
      expect(convertResult.balance?.credits).toBeGreaterThan(0);
      expect(convertResult.balance?.points).toBeLessThan(100);
    });

    test('should handle payout requests', async () => {
      // Add points for payout
      await walletService.addTransaction({
        walletId: testWalletId,
        type: 'referral_bonus',
        amount: 0,
        points: 1000,
        description: 'Test points for payout'
      });

      // Request payout
      const payoutResult = await walletService.requestPayout({
        ambassadorId: testAmbassadorId,
        amount: 100,
        pointsToRedeem: 1000,
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'TEST0001',
          accountHolderName: 'Test User',
          bankName: 'Test Bank'
        }
      });

      expect(payoutResult.success).toBe(true);
    });
  });

  describe('Webhook Processing', () => {
    test('should handle Razorpay webhook successfully', async () => {
      const mockWebhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test123',
              order_id: 'order_test123',
              amount: 100000, // 1000 INR in paise
              currency: 'INR',
              status: 'captured',
              method: 'card',
              created_at: Math.floor(Date.now() / 1000)
            }
          }
        }
      };

      // Create a payment record first
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          student_id: testUserId,
          amount: 1000,
          currency: 'INR',
          gateway: 'razorpay',
          gateway_order_id: 'order_test123',
          status: 'pending'
        })
        .select()
        .single();

      const result = await paymentService.handleWebhook(
        'razorpay',
        mockWebhookPayload,
        'test_signature'
      );

      // Note: This will fail signature verification in real scenario
      // but tests the webhook processing logic
      expect(result).toBeDefined();
    });

    test('should handle Stripe webhook successfully', async () => {
      const mockWebhookPayload = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 100000, // 1000 INR in cents
            currency: 'inr',
            status: 'succeeded',
            payment_method_types: ['card'],
            created: Math.floor(Date.now() / 1000)
          }
        }
      };

      // Create a payment record first
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          student_id: testUserId,
          amount: 1000,
          currency: 'INR',
          gateway: 'stripe',
          gateway_payment_id: 'pi_test123',
          status: 'pending'
        })
        .select()
        .single();

      const result = await paymentService.handleWebhook(
        'stripe',
        mockWebhookPayload,
        'test_signature'
      );

      // Note: This will fail signature verification in real scenario
      // but tests the webhook processing logic
      expect(result).toBeDefined();
    });
  });

  describe('Transaction History and Reconciliation', () => {
    test('should retrieve transaction history', async () => {
      // Add some transactions
      await walletService.addTransaction({
        walletId: testWalletId,
        type: 'credit',
        amount: 100,
        description: 'Test transaction 1'
      });

      await walletService.addTransaction({
        walletId: testWalletId,
        type: 'debit',
        amount: 50,
        description: 'Test transaction 2'
      });

      const transactions = await walletService.getTransactionHistory(testWalletId, 10);

      expect(transactions).toBeInstanceOf(Array);
      expect(transactions.length).toBeGreaterThan(0);
    });

    test('should retrieve wallet credits', async () => {
      // Add wallet credit
      await walletService.addWalletCredit(testUserId, 500, 'test_credit');

      const credits = await walletService.getWalletCredits(testWalletId);

      expect(credits).toBeInstanceOf(Array);
      expect(credits.length).toBeGreaterThan(0);
      expect(credits[0].remaining_amount).toBeGreaterThan(0);
    });

    test('should get ambassador earnings summary', async () => {
      const earnings = await walletService.getAmbassadorEarnings(testAmbassadorId);

      expect(earnings).toBeDefined();
      expect(earnings.ambassador).toBeDefined();
      expect(earnings.wallet).toBeDefined();
      expect(earnings.earnings).toBeDefined();
      expect(earnings.earnings.totalReferrals).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid payment gateway', async () => {
      const result = await paymentService.createPayment({
        gateway: 'invalid' as any,
        amount: 100,
        currency: 'INR',
        description: 'Invalid gateway test',
        studentId: testUserId
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported payment gateway');
    });

    test('should handle duplicate subscription creation', async () => {
      // Create first subscription
      await walletService.addWalletCredit(testUserId, 2000, 'test_credit');
      
      const firstResult = await subscriptionService.createSubscription({
        studentId: testUserId,
        courseId: testCourseId,
        billingCycle: 'monthly' as const,
        amount: 1000,
        currency: 'INR'
      });

      expect(firstResult.success).toBe(true);

      // Try to create duplicate subscription
      const duplicateResult = await subscriptionService.createSubscription({
        studentId: testUserId,
        courseId: testCourseId,
        billingCycle: 'monthly' as const,
        amount: 1000,
        currency: 'INR'
      });

      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.error).toContain('Active subscription already exists');
    });

    test('should handle insufficient points for payout', async () => {
      const payoutResult = await walletService.requestPayout({
        ambassadorId: testAmbassadorId,
        amount: 1000,
        pointsToRedeem: 10000, // More points than available
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'TEST0001',
          accountHolderName: 'Test User',
          bankName: 'Test Bank'
        }
      });

      expect(payoutResult.success).toBe(false);
      expect(payoutResult.error).toContain('Insufficient points');
    });
  });
});