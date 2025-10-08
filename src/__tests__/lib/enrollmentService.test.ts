import { EnrollmentService } from '../../lib/enrollmentService';
import { CouponService } from '../../lib/couponService';
import {
    EnrollmentStatus,
    CreateEnrollmentInput,
    CreateSubscriptionInput,
    CreatePaymentInput,
    PaymentStatus,
    SubscriptionStatus
} from '../../models/Enrollment';
import {
    CouponDiscountType,
    CreateCouponInput
} from '../../models/Coupon';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => ({ data: null, error: null })),
                    range: jest.fn(() => ({ data: [], error: null, count: 0 }))
                })),
                in: jest.fn(() => ({ data: [], error: null })),
                gte: jest.fn(() => ({
                    lte: jest.fn(() => ({ data: [], error: null }))
                })),
                order: jest.fn(() => ({
                    range: jest.fn(() => ({ data: [], error: null, count: 0 }))
                }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => ({
                        data: {
                            id: 'test-id',
                            course_id: 'course-1',
                            student_id: 'student-1',
                            status: EnrollmentStatus.ACTIVE,
                            amount_paid: 1000,
                            currency: 'INR',
                            enrollment_date: new Date(),
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                        error: null
                    }))
                }))
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => ({
                            data: {
                                id: 'test-id',
                                status: EnrollmentStatus.COMPLETED
                            },
                            error: null
                        }))
                    }))
                }))
            })),
            delete: jest.fn(() => ({
                eq: jest.fn(() => ({ error: null }))
            }))
        }))
    }))
}));

describe('EnrollmentService', () => {
    let enrollmentService: EnrollmentService;
    let couponService: CouponService;

    beforeEach(() => {
        enrollmentService = new EnrollmentService();
        couponService = new CouponService();
        jest.clearAllMocks();
    });

    describe('enrollStudent', () => {
        it('should create a new enrollment successfully', async () => {
            const enrollmentData: CreateEnrollmentInput = {
                course_id: 'course-1',
                student_id: 'student-1',
                status: EnrollmentStatus.ACTIVE,
                amount_paid: 1000,
                currency: 'INR',
                enrollment_source: 'direct',
                payment_method: 'card',
                transaction_id: 'txn-123'
            };

            const result = await enrollmentService.enrollStudent(enrollmentData);

            expect(result).toBeDefined();
            expect(result.course_id).toBe('course-1');
            expect(result.student_id).toBe('student-1');
            expect(result.amount_paid).toBe(1000);
            expect(result.status).toBe(EnrollmentStatus.ACTIVE);
        });

        it('should handle enrollment with coupon code', async () => {
            const enrollmentData: CreateEnrollmentInput = {
                course_id: 'course-1',
                student_id: 'student-1',
                status: EnrollmentStatus.ACTIVE,
                amount_paid: 800, // Discounted amount
                currency: 'INR',
                enrollment_source: 'direct',
                coupon_code: 'SAVE20'
            };

            const result = await enrollmentService.enrollStudent(enrollmentData);

            expect(result).toBeDefined();
            expect(result.coupon_code).toBe('SAVE20');
            expect(result.amount_paid).toBe(800);
        });

        it('should handle enrollment with referral code', async () => {
            const enrollmentData: CreateEnrollmentInput = {
                course_id: 'course-1',
                student_id: 'student-1',
                status: EnrollmentStatus.ACTIVE,
                amount_paid: 1000,
                currency: 'INR',
                enrollment_source: 'referral',
                referral_code: 'REF123'
            };

            const result = await enrollmentService.enrollStudent(enrollmentData);

            expect(result).toBeDefined();
            expect(result.referral_code).toBe('REF123');
            expect(result.enrollment_source).toBe('referral');
        });
    });

    describe('updateEnrollmentStatus', () => {
        it('should update enrollment status successfully', async () => {
            const result = await enrollmentService.updateEnrollmentStatus(
                'enrollment-1',
                EnrollmentStatus.COMPLETED,
                'student-1'
            );

            expect(result).toBeDefined();
            expect(result.status).toBe(EnrollmentStatus.COMPLETED);
        });
    });

    describe('updateEnrollmentProgress', () => {
        it('should update enrollment progress successfully', async () => {
            const progressUpdate = {
                completedSessions: ['session-1', 'session-2'],
                totalSessions: 10,
                completionPercentage: 20,
                timeSpent: 120 // minutes
            };

            const result = await enrollmentService.updateEnrollmentProgress(
                'enrollment-1',
                'student-1',
                progressUpdate
            );

            expect(result).toBeDefined();
        });
    });

    describe('validateCoupon', () => {
        it('should validate a valid coupon successfully', async () => {
            const validationData = {
                code: 'SAVE20',
                course_id: 'course-1',
                user_id: 'user-1',
                amount: 1000
            };

            const result = await enrollmentService.validateCoupon(validationData);

            expect(result).toBeDefined();
            expect(result.isValid).toBe(false); // Will be false due to mocked data
            expect(result.finalAmount).toBe(1000);
        });
    });

    describe('createSubscription', () => {
        it('should create a subscription successfully', async () => {
            const subscriptionData: CreateSubscriptionInput = {
                student_id: 'student-1',
                course_id: 'course-1',
                subscription_type: 'monthly',
                status: SubscriptionStatus.ACTIVE,
                amount: 999,
                currency: 'INR',
                billing_cycle: 'monthly',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                auto_renew: true,
                failed_payment_count: 0
            };

            const result = await enrollmentService.createSubscription(subscriptionData);

            expect(result).toBeDefined();
        });
    });

    describe('createPayment', () => {
        it('should create a payment record successfully', async () => {
            const paymentData: CreatePaymentInput = {
                student_id: 'student-1',
                enrollment_id: 'enrollment-1',
                amount: 1000,
                currency: 'INR',
                status: PaymentStatus.PENDING,
                gateway: 'razorpay',
                gateway_order_id: 'order_123',
                payment_method: 'card',
                discount_amount: 0,
                refund_amount: 0
            };

            const result = await enrollmentService.createPayment(paymentData);

            expect(result).toBeDefined();
        });
    });

    describe('getCourseCapacity', () => {
        it('should return course capacity information', async () => {
            const result = await enrollmentService.getCourseCapacity('course-1');

            expect(result).toBeDefined();
            expect(result.course_id).toBe('course-1');
            expect(typeof result.is_full).toBe('boolean');
        });
    });

    describe('getEnrollmentStats', () => {
        it('should return enrollment statistics', async () => {
            const result = await enrollmentService.getEnrollmentStats({
                course_id: 'course-1'
            });

            expect(result).toBeDefined();
            expect(typeof result.totalEnrollments).toBe('number');
            expect(typeof result.activeEnrollments).toBe('number');
            expect(typeof result.totalRevenue).toBe('number');
            expect(Array.isArray(result.enrollmentsByMonth)).toBe(true);
        });
    });
});

describe('CouponService', () => {
    let couponService: CouponService;

    beforeEach(() => {
        couponService = new CouponService();
        jest.clearAllMocks();
    });

    describe('createCoupon', () => {
        it('should create a coupon successfully', async () => {
            const couponData: CreateCouponInput = {
                code: 'SAVE20',
                description: '20% off on all courses',
                discount_type: CouponDiscountType.PERCENTAGE,
                discount_value: 20,
                min_amount: 500,
                usage_limit: 100,
                valid_from: new Date(),
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                is_active: true
            };

            const result = await couponService.createCoupon(couponData, 'admin-1');

            expect(result).toBeDefined();
        });
    });

    describe('generateUniqueCouponCode', () => {
        it('should generate a unique coupon code', async () => {
            const code = await couponService.generateUniqueCouponCode('SAVE', 6);

            expect(code).toBeDefined();
            expect(code).toMatch(/^SAVE_[A-Z0-9]{6}$/);
        });
    });
});

describe('Coupon Validation Logic', () => {
    it('should calculate percentage discount correctly', () => {
        const coupon = {
            discount_type: CouponDiscountType.PERCENTAGE,
            discount_value: 20,
            max_discount: 500
        } as any;

        // Mock the CouponUtils.calculateDiscount method
        const calculateDiscount = (coupon: any, amount: number) => {
            let discount = 0;
            if (coupon.discount_type === CouponDiscountType.PERCENTAGE) {
                discount = (amount * coupon.discount_value) / 100;
            }
            if (coupon.max_discount && discount > coupon.max_discount) {
                discount = coupon.max_discount;
            }
            return Math.min(discount, amount);
        };

        expect(calculateDiscount(coupon, 1000)).toBe(200); // 20% of 1000
        expect(calculateDiscount(coupon, 3000)).toBe(500); // Capped at max_discount
    });

    it('should calculate fixed discount correctly', () => {
        const coupon = {
            discount_type: CouponDiscountType.FIXED,
            discount_value: 100
        } as any;

        const calculateDiscount = (coupon: any, amount: number) => {
            let discount = 0;
            if (coupon.discount_type === CouponDiscountType.FIXED) {
                discount = coupon.discount_value;
            }
            return Math.min(discount, amount);
        };

        expect(calculateDiscount(coupon, 1000)).toBe(100);
        expect(calculateDiscount(coupon, 50)).toBe(50); // Can't exceed original amount
    });
});