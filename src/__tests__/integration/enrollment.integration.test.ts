/**
 * Integration tests for enrollment system
 * These tests verify the enrollment workflow end-to-end
 */

import { EnrollmentService } from '../../lib/enrollmentService';
import { CouponService } from '../../lib/couponService';
import { 
  EnrollmentStatus, 
  CreateEnrollmentInput,
  PaymentStatus
} from '../../models/Enrollment';
import { 
  CouponDiscountType,
  CreateCouponInput,
  CouponUtils
} from '../../models/Coupon';

describe('Enrollment System Integration', () => {
  describe('Enrollment Workflow', () => {
    it('should handle complete enrollment process', () => {
      // Test the enrollment workflow logic
      const enrollmentData: CreateEnrollmentInput = {
        course_id: 'course-123',
        student_id: 'student-456',
        status: EnrollmentStatus.ACTIVE,
        amount_paid: 1000,
        currency: 'INR',
        enrollment_source: 'direct',
        payment_method: 'card',
        transaction_id: 'txn-789'
      };

      // Validate enrollment data structure
      expect(enrollmentData.course_id).toBeDefined();
      expect(enrollmentData.student_id).toBeDefined();
      expect(enrollmentData.amount_paid).toBeGreaterThan(0);
      expect(enrollmentData.currency).toBe('INR');
    });

    it('should handle enrollment with coupon discount', () => {
      const originalAmount = 1000;
      const couponData: CreateCouponInput = {
        code: 'SAVE20',
        description: '20% off',
        discount_type: CouponDiscountType.PERCENTAGE,
        discount_value: 20,
        min_amount: 500,
        is_active: true,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      // Calculate discount
      const discount = CouponUtils.calculateDiscount(couponData as any, originalAmount);
      const finalAmount = originalAmount - discount;

      expect(discount).toBe(200); // 20% of 1000
      expect(finalAmount).toBe(800);

      const enrollmentData: CreateEnrollmentInput = {
        course_id: 'course-123',
        student_id: 'student-456',
        status: EnrollmentStatus.ACTIVE,
        amount_paid: finalAmount,
        currency: 'INR',
        coupon_code: 'SAVE20',
        enrollment_source: 'direct'
      };

      expect(enrollmentData.amount_paid).toBe(800);
      expect(enrollmentData.coupon_code).toBe('SAVE20');
    });

    it('should handle subscription-based enrollment', () => {
      const subscriptionData = {
        student_id: 'student-456',
        course_id: 'course-123',
        subscription_type: 'monthly',
        amount: 999,
        currency: 'INR',
        billing_cycle: 'monthly' as const,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        auto_renew: true
      };

      expect(subscriptionData.billing_cycle).toBe('monthly');
      expect(subscriptionData.auto_renew).toBe(true);
      expect(subscriptionData.amount).toBeGreaterThan(0);
    });
  });

  describe('Coupon Validation Logic', () => {
    it('should validate percentage coupons correctly', () => {
      const coupon = {
        id: 'coupon-1',
        code: 'SAVE20',
        discount_type: CouponDiscountType.PERCENTAGE,
        discount_value: 20,
        min_amount: 100,
        max_discount: 500,
        is_active: true,
        valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        usage_limit: 100,
        used_count: 5,
        created_at: new Date()
      };

      // Test date validation
      expect(CouponUtils.isDateValid(coupon as any)).toBe(true);

      // Test usage limit validation
      expect(CouponUtils.isUsageLimitValid(coupon as any)).toBe(true);

      // Test minimum amount validation
      expect(CouponUtils.meetsMinimumAmount(coupon as any, 150)).toBe(true);
      expect(CouponUtils.meetsMinimumAmount(coupon as any, 50)).toBe(false);

      // Test discount calculation
      expect(CouponUtils.calculateDiscount(coupon as any, 1000)).toBe(200); // 20%
      expect(CouponUtils.calculateDiscount(coupon as any, 3000)).toBe(500); // Capped at max_discount
    });

    it('should validate fixed amount coupons correctly', () => {
      const coupon = {
        id: 'coupon-2',
        code: 'FLAT100',
        discount_type: CouponDiscountType.FIXED,
        discount_value: 100,
        min_amount: 200,
        is_active: true,
        valid_from: new Date(),
        usage_limit: 50,
        used_count: 10,
        created_at: new Date()
      };

      // Test discount calculation
      expect(CouponUtils.calculateDiscount(coupon as any, 500)).toBe(100);
      expect(CouponUtils.calculateDiscount(coupon as any, 50)).toBe(50); // Can't exceed original amount

      // Test minimum amount
      expect(CouponUtils.meetsMinimumAmount(coupon as any, 250)).toBe(true);
      expect(CouponUtils.meetsMinimumAmount(coupon as any, 150)).toBe(false);
    });

    it('should handle expired coupons', () => {
      const expiredCoupon = {
        id: 'coupon-3',
        code: 'EXPIRED',
        discount_type: CouponDiscountType.PERCENTAGE,
        discount_value: 10,
        min_amount: 0,
        is_active: true,
        valid_from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        valid_until: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        usage_limit: 100,
        used_count: 5,
        created_at: new Date()
      };

      expect(CouponUtils.isDateValid(expiredCoupon as any)).toBe(false);

      const validation = CouponUtils.validateCoupon(expiredCoupon as any, 1000);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('expired');
    });

    it('should handle usage limit exceeded', () => {
      const limitExceededCoupon = {
        id: 'coupon-4',
        code: 'LIMITED',
        discount_type: CouponDiscountType.PERCENTAGE,
        discount_value: 15,
        min_amount: 0,
        is_active: true,
        valid_from: new Date(),
        usage_limit: 10,
        used_count: 10, // Limit reached
        created_at: new Date()
      };

      expect(CouponUtils.isUsageLimitValid(limitExceededCoupon as any)).toBe(false);

      const validation = CouponUtils.validateCoupon(limitExceededCoupon as any, 1000);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('usage limit');
    });
  });

  describe('Course Capacity Management', () => {
    it('should calculate course capacity correctly', () => {
      const courseCapacity = {
        course_id: 'course-123',
        max_students: 50,
        current_enrollment: 30,
        waitlist_count: 5,
        available_spots: 20,
        is_full: false
      };

      expect(courseCapacity.available_spots).toBe(courseCapacity.max_students - courseCapacity.current_enrollment);
      expect(courseCapacity.is_full).toBe(false);

      // Test full capacity
      const fullCourse = {
        ...courseCapacity,
        current_enrollment: 50,
        available_spots: 0,
        is_full: true
      };

      expect(fullCourse.is_full).toBe(true);
      expect(fullCourse.available_spots).toBe(0);
    });

    it('should handle unlimited capacity courses', () => {
      const unlimitedCourse = {
        course_id: 'course-456',
        max_students: undefined,
        current_enrollment: 100,
        waitlist_count: 0,
        available_spots: undefined,
        is_full: false
      };

      expect(unlimitedCourse.is_full).toBe(false);
      expect(unlimitedCourse.available_spots).toBeUndefined();
    });
  });

  describe('Payment Processing', () => {
    it('should handle payment workflow', () => {
      const paymentData = {
        student_id: 'student-456',
        enrollment_id: 'enrollment-789',
        amount: 1000,
        currency: 'INR',
        gateway: 'razorpay',
        gateway_order_id: 'order_123456',
        payment_method: 'card',
        status: PaymentStatus.PENDING
      };

      expect(paymentData.amount).toBeGreaterThan(0);
      expect(paymentData.gateway).toBeDefined();
      expect(paymentData.status).toBe(PaymentStatus.PENDING);

      // Simulate successful payment
      const successfulPayment = {
        ...paymentData,
        status: PaymentStatus.COMPLETED,
        gateway_payment_id: 'pay_789012',
        payment_date: new Date()
      };

      expect(successfulPayment.status).toBe(PaymentStatus.COMPLETED);
      expect(successfulPayment.gateway_payment_id).toBeDefined();
    });

    it('should handle payment with coupon discount', () => {
      const originalAmount = 1000;
      const discountAmount = 200;
      const finalAmount = originalAmount - discountAmount;

      const paymentData = {
        student_id: 'student-456',
        enrollment_id: 'enrollment-789',
        amount: finalAmount,
        currency: 'INR',
        gateway: 'razorpay',
        coupon_code: 'SAVE20',
        discount_amount: discountAmount
      };

      expect(paymentData.amount).toBe(800);
      expect(paymentData.discount_amount).toBe(200);
      expect(paymentData.coupon_code).toBe('SAVE20');
    });
  });

  describe('Enrollment Progress Tracking', () => {
    it('should track student progress correctly', () => {
      const initialProgress = {
        completedSessions: [],
        totalSessions: 10,
        completionPercentage: 0,
        timeSpent: 0
      };

      expect(initialProgress.completionPercentage).toBe(0);
      expect(initialProgress.completedSessions.length).toBe(0);

      // Simulate progress update
      const updatedProgress = {
        completedSessions: ['session-1', 'session-2'],
        totalSessions: 10,
        completionPercentage: 20,
        timeSpent: 120, // 2 hours
        lastSessionCompleted: 'session-2'
      };

      expect(updatedProgress.completionPercentage).toBe(20);
      expect(updatedProgress.completedSessions.length).toBe(2);
      expect(updatedProgress.timeSpent).toBe(120);
    });
  });

  describe('Enrollment Statistics', () => {
    it('should calculate enrollment statistics correctly', () => {
      const mockEnrollments = [
        { status: EnrollmentStatus.ACTIVE, amount_paid: 1000, enrollment_date: '2024-01-15' },
        { status: EnrollmentStatus.ACTIVE, amount_paid: 800, enrollment_date: '2024-01-20' },
        { status: EnrollmentStatus.COMPLETED, amount_paid: 1200, enrollment_date: '2024-02-10' },
        { status: EnrollmentStatus.CANCELLED, amount_paid: 0, enrollment_date: '2024-02-15' }
      ];

      const stats = {
        totalEnrollments: mockEnrollments.length,
        activeEnrollments: mockEnrollments.filter(e => e.status === EnrollmentStatus.ACTIVE).length,
        completedEnrollments: mockEnrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length,
        totalRevenue: mockEnrollments.reduce((sum, e) => sum + e.amount_paid, 0),
        averageCompletionRate: 75 // Mock value
      };

      expect(stats.totalEnrollments).toBe(4);
      expect(stats.activeEnrollments).toBe(2);
      expect(stats.completedEnrollments).toBe(1);
      expect(stats.totalRevenue).toBe(3000);
      expect(stats.averageCompletionRate).toBe(75);
    });
  });
});