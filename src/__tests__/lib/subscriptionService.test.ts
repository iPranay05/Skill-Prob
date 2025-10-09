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
      lte: jest.fn(() => ({
        limit: jest.fn()
      })),
      lt: jest.fn(),
      in: jest.fn(),
      order: jest.fn(() => ({
        range: jest.fn()
      }))
    }))
  }))
}));

jest.mock('@/lib/paymentService', () => ({
  paymentService: {
    createPayment: jest.fn()
  }
}));

import { subscriptionService } from '@/lib/subscriptionService';

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    test('should validate subscription configuration', async () => {
      const invalidConfig = {
        studentId: 'invalid-uuid',
        courseId: 'invalid-uuid',
        billingCycle: 'invalid' as any,
        amount: -100,
        currency: 'INVALID'
      };

      const result = await subscriptionService.createSubscription(invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Subscription creation failed');
    });

    test('should prevent duplicate active subscriptions', async () => {
      const validConfig = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        courseId: '123e4567-e89b-12d3-a456-426614174001',
        billingCycle: 'monthly' as const,
        amount: 1000,
        currency: 'INR'
      };

      // Mock existing active subscription
      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: { id: 'existing-subscription' },
        error: null
      });

      const result = await subscriptionService.createSubscription(validConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Active subscription already exists for this course');
    });

    test('should create subscription and initial payment', async () => {
      const validConfig = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        courseId: '123e4567-e89b-12d3-a456-426614174001',
        billingCycle: 'monthly' as const,
        amount: 1000,
        currency: 'INR'
      };

      // Mock no existing subscription
      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful subscription creation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'subscription-123', ...validConfig },
        error: null
      });

      // Mock successful payment creation
      mockPaymentService.createPayment.mockResolvedValue({
        success: true,
        paymentId: 'payment-123'
      });

      const result = await subscriptionService.createSubscription(validConfig);

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe('subscription-123');
      expect(result.paymentId).toBe('payment-123');
      expect(mockPaymentService.createPayment).toHaveBeenCalled();
    });

    test('should rollback subscription if payment fails', async () => {
      const validConfig = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        courseId: '123e4567-e89b-12d3-a456-426614174001',
        billingCycle: 'monthly' as const,
        amount: 1000,
        currency: 'INR'
      };

      // Mock no existing subscription
      mockSupabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock successful subscription creation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'subscription-123', ...validConfig },
        error: null
      });

      // Mock failed payment creation
      mockPaymentService.createPayment.mockResolvedValue({
        success: false,
        error: 'Payment failed'
      });

      const result = await subscriptionService.createSubscription(validConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment failed');
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('subscription-123');
    });
  });

  describe('renewSubscription', () => {
    test('should validate subscription exists and is active', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock subscription not found
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await subscriptionService.renewSubscription(subscriptionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Subscription not found');
    });

    test('should prevent renewal of inactive subscription', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock inactive subscription
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: subscriptionId,
          status: 'cancelled',
          amount: 1000,
          currency: 'INR'
        },
        error: null
      });

      const result = await subscriptionService.renewSubscription(subscriptionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot renew inactive subscription');
    });

    test('should renew subscription successfully', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock active subscription
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: subscriptionId,
          status: 'active',
          amount: 1000,
          currency: 'INR',
          billing_cycle: 'monthly',
          current_period_end: new Date().toISOString(),
          failed_payment_count: 0,
          student_id: 'student-123',
          course_id: 'course-123'
        },
        error: null
      });

      // Mock successful payment creation
      mockPaymentService.createPayment.mockResolvedValue({
        success: true,
        paymentId: 'payment-123'
      });

      const result = await subscriptionService.renewSubscription(subscriptionId);

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe(subscriptionId);
      expect(result.paymentId).toBe('payment-123');
    });

    test('should handle failed renewal payment', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock active subscription
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: subscriptionId,
          status: 'active',
          amount: 1000,
          currency: 'INR',
          billing_cycle: 'monthly',
          current_period_end: new Date().toISOString(),
          failed_payment_count: 0,
          student_id: 'student-123',
          course_id: 'course-123'
        },
        error: null
      });

      // Mock failed payment creation
      mockPaymentService.createPayment.mockResolvedValue({
        success: false,
        error: 'Insufficient funds'
      });

      const result = await subscriptionService.renewSubscription(subscriptionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
      expect(mockSupabase.from().update().eq).toHaveBeenCalled();
    });
  });

  describe('cancelSubscription', () => {
    test('should cancel active subscription', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock active subscription
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: subscriptionId,
          status: 'active'
        },
        error: null
      });

      const result = await subscriptionService.cancelSubscription(
        subscriptionId,
        'User requested cancellation'
      );

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe(subscriptionId);
      expect(mockSupabase.from().update().eq).toHaveBeenCalled();
    });

    test('should prevent cancellation of already cancelled subscription', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock cancelled subscription
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: subscriptionId,
          status: 'cancelled'
        },
        error: null
      });

      const result = await subscriptionService.cancelSubscription(subscriptionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Subscription already cancelled');
    });
  });

  describe('pauseSubscription', () => {
    test('should pause active subscription', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock active subscription
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: subscriptionId,
          status: 'active'
        },
        error: null
      });

      const result = await subscriptionService.pauseSubscription(
        subscriptionId,
        'Temporary pause'
      );

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe(subscriptionId);
    });

    test('should only allow pausing active subscriptions', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock cancelled subscription
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: subscriptionId,
          status: 'cancelled'
        },
        error: null
      });

      const result = await subscriptionService.pauseSubscription(subscriptionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Can only pause active subscriptions');
    });
  });

  describe('resumeSubscription', () => {
    test('should resume paused subscription', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock paused subscription
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: subscriptionId,
          status: 'paused',
          billing_cycle: 'monthly'
        },
        error: null
      });

      const result = await subscriptionService.resumeSubscription(subscriptionId);

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe(subscriptionId);
    });

    test('should only allow resuming paused subscriptions', async () => {
      const subscriptionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock active subscription
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: subscriptionId,
          status: 'active'
        },
        error: null
      });

      const result = await subscriptionService.resumeSubscription(subscriptionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Can only resume paused subscriptions');
    });
  });

  describe('processScheduledRenewals', () => {
    test('should process due renewals', async () => {
      // Mock subscriptions due for renewal
      mockSupabase.from().select().eq().eq().lte().limit.mockResolvedValue({
        data: [
          {
            id: 'subscription-1',
            status: 'active',
            billing_cycle: 'monthly'
          },
          {
            id: 'subscription-2',
            status: 'active',
            billing_cycle: 'monthly'
          }
        ],
        error: null
      });

      // Mock successful renewals
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: {
            id: 'subscription-1',
            status: 'active',
            amount: 1000,
            currency: 'INR',
            billing_cycle: 'monthly',
            current_period_end: new Date().toISOString(),
            failed_payment_count: 0,
            student_id: 'student-1',
            course_id: 'course-1'
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            id: 'subscription-2',
            status: 'active',
            amount: 1500,
            currency: 'INR',
            billing_cycle: 'monthly',
            current_period_end: new Date().toISOString(),
            failed_payment_count: 0,
            student_id: 'student-2',
            course_id: 'course-2'
          },
          error: null
        });

      mockPaymentService.createPayment
        .mockResolvedValueOnce({ success: true, paymentId: 'payment-1' })
        .mockResolvedValueOnce({ success: true, paymentId: 'payment-2' });

      const result = await subscriptionService.processScheduledRenewals();

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
    });

    test('should handle renewal failures', async () => {
      // Mock subscriptions due for renewal
      mockSupabase.from().select().eq().eq().lte().limit.mockResolvedValue({
        data: [
          {
            id: 'subscription-1',
            status: 'active',
            billing_cycle: 'monthly'
          }
        ],
        error: null
      });

      // Mock subscription details
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'subscription-1',
          status: 'active',
          amount: 1000,
          currency: 'INR',
          billing_cycle: 'monthly',
          current_period_end: new Date().toISOString(),
          failed_payment_count: 0,
          student_id: 'student-1',
          course_id: 'course-1'
        },
        error: null
      });

      // Mock failed payment
      mockPaymentService.createPayment.mockResolvedValue({
        success: false,
        error: 'Payment failed'
      });

      const result = await subscriptionService.processScheduledRenewals();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe('expireSubscriptions', () => {
    test('should expire subscriptions past their end date', async () => {
      // Mock expired subscriptions
      mockSupabase.from().select().eq().eq().lt.mockResolvedValue({
        data: [
          { id: 'subscription-1' },
          { id: 'subscription-2' }
        ],
        error: null
      });

      const result = await subscriptionService.expireSubscriptions();

      expect(result).toBe(2);
      expect(mockSupabase.from().update().in).toHaveBeenCalled();
    });

    test('should handle no expired subscriptions', async () => {
      // Mock no expired subscriptions
      mockSupabase.from().select().eq().eq().lt.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await subscriptionService.expireSubscriptions();

      expect(result).toBe(0);
    });
  });

  describe('Billing Date Calculations', () => {
    test('should calculate monthly billing dates correctly', () => {
      const startDate = new Date('2024-01-15');
      const nextDate = subscriptionService['calculateNextBillingDate'](startDate, 'monthly');
      
      expect(nextDate.getMonth()).toBe(1); // February (0-indexed)
      expect(nextDate.getDate()).toBe(15);
    });

    test('should calculate yearly billing dates correctly', () => {
      const startDate = new Date('2024-01-15');
      const nextDate = subscriptionService['calculateNextBillingDate'](startDate, 'yearly');
      
      expect(nextDate.getFullYear()).toBe(2025);
      expect(nextDate.getMonth()).toBe(0); // January
      expect(nextDate.getDate()).toBe(15);
    });
  });
});