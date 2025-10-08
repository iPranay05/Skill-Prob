import { EnrollmentService } from '../../lib/enrollmentService';
import { 
  CouponDiscountType,
  CouponUtils,
  Coupon,
  CouponValidationResult
} from '../../models/Coupon';
import { APIError } from '../../lib/errors';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ 
            data: { id: 'usage-123' }, 
            error: null 
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null }))
      }))
    }))
  }))
}));

describe('Pricing Calculations and Discount Applications', () => {
  let enrollmentService: EnrollmentService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    enrollmentService = new EnrollmentService();
    mockSupabaseClient = require('@supabase/supabase-js').createClient();
    jest.clearAllMocks();
  });

  describe('CouponUtils - Discount Calculations', () => {
    describe('calculateDiscount', () => {
      it('should calculate percentage discount correctly', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'SAVE20',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        const discount = CouponUtils.calculateDiscount(coupon, 1000);
        expect(discount).toBe(200); // 20% of 1000
      });

      it('should calculate fixed discount correctly', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'FLAT100',
          discount_type: CouponDiscountType.FIXED,
          discount_value: 100,
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        const discount = CouponUtils.calculateDiscount(coupon, 1000);
        expect(discount).toBe(100);
      });

      it('should apply maximum discount limit for percentage coupons', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'SAVE50',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 50,
          max_discount: 500,
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        // 50% of 2000 would be 1000, but max_discount is 500
        const discount = CouponUtils.calculateDiscount(coupon, 2000);
        expect(discount).toBe(500);
      });

      it('should not exceed original amount', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'FLAT500',
          discount_type: CouponDiscountType.FIXED,
          discount_value: 500,
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        // Discount value is higher than amount
        const discount = CouponUtils.calculateDiscount(coupon, 300);
        expect(discount).toBe(300); // Should not exceed original amount
      });

      it('should handle zero amount', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'SAVE20',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        const discount = CouponUtils.calculateDiscount(coupon, 0);
        expect(discount).toBe(0);
      });
    });

    describe('Coupon Validation', () => {
      it('should validate active coupon within date range', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'VALID20',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 500,
          used_count: 5,
          usage_limit: 100,
          valid_from: new Date('2024-01-01'),
          valid_until: new Date('2024-12-31'),
          is_active: true,
          created_at: new Date()
        };

        const validation = CouponUtils.validateCoupon(coupon, 1000);
        expect(validation.isValid).toBe(true);
      });

      it('should reject inactive coupon', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'INACTIVE',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: false, // Inactive
          created_at: new Date()
        };

        const validation = CouponUtils.validateCoupon(coupon, 1000);
        expect(validation.isValid).toBe(false);
        expect(validation.error).toBe('Coupon is not active');
      });

      it('should reject expired coupon', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'EXPIRED',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2023-01-01'),
          valid_until: new Date('2023-12-31'), // Expired
          is_active: true,
          created_at: new Date()
        };

        const validation = CouponUtils.validateCoupon(coupon, 1000);
        expect(validation.isValid).toBe(false);
        expect(validation.error).toBe('Coupon has expired or is not yet valid');
      });

      it('should reject coupon that hasn\'t started yet', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'FUTURE',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 0,
          valid_from: futureDate, // Future date
          is_active: true,
          created_at: new Date()
        };

        const validation = CouponUtils.validateCoupon(coupon, 1000);
        expect(validation.isValid).toBe(false);
        expect(validation.error).toBe('Coupon has expired or is not yet valid');
      });

      it('should reject coupon that exceeded usage limit', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'MAXED',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 100,
          usage_limit: 100, // At limit
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        const validation = CouponUtils.validateCoupon(coupon, 1000);
        expect(validation.isValid).toBe(false);
        expect(validation.error).toBe('Coupon usage limit exceeded');
      });

      it('should reject coupon when amount doesn\'t meet minimum', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'MIN500',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 500,
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        const validation = CouponUtils.validateCoupon(coupon, 300); // Below minimum
        expect(validation.isValid).toBe(false);
        expect(validation.error).toContain('Minimum amount of 500');
      });

      it('should handle coupon with no usage limit', () => {
        const coupon: Coupon = {
          id: 'coupon-1',
          code: 'UNLIMITED',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 1000, // High usage count
          // No usage_limit set
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        const validation = CouponUtils.validateCoupon(coupon, 1000);
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe('EnrollmentService - Coupon Validation', () => {
    describe('validateCoupon', () => {
      it('should validate existing coupon successfully', async () => {
        const mockCoupon = {
          id: 'coupon-123',
          code: 'SAVE20',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          max_discount: 500,
          used_count: 10,
          usage_limit: 100,
          valid_from: new Date('2024-01-01'),
          valid_until: new Date('2024-12-31'),
          is_active: true,
          created_at: new Date()
        };

        mockSupabaseClient.from = jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockCoupon, error: null }))
              }))
            }))
          })
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: null, error: null })) // No previous usage
              }))
            }))
          });

        const result = await enrollmentService.validateCoupon({
          code: 'SAVE20',
          course_id: 'course-1',
          user_id: 'user-1',
          amount: 1000
        });

        expect(result.isValid).toBe(true);
        expect(result.discountAmount).toBe(200); // 20% of 1000
        expect(result.finalAmount).toBe(800);
        expect(result.coupon).toEqual(mockCoupon);
      });

      it('should reject invalid coupon code', async () => {
        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: { code: 'PGRST116' } }))
            }))
          }))
        }));

        const result = await enrollmentService.validateCoupon({
          code: 'INVALID',
          course_id: 'course-1',
          user_id: 'user-1',
          amount: 1000
        });

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid coupon code');
        expect(result.finalAmount).toBe(1000);
      });

      it('should reject coupon already used for same course', async () => {
        const mockCoupon = {
          id: 'coupon-123',
          code: 'SAVE20',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 10,
          usage_limit: 100,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        const mockUsage = {
          id: 'usage-123',
          coupon_id: 'coupon-123',
          user_id: 'user-1',
          course_id: 'course-1'
        };

        mockSupabaseClient.from = jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockCoupon, error: null }))
              }))
            }))
          })
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockUsage, error: null })) // Already used
              }))
            }))
          });

        const result = await enrollmentService.validateCoupon({
          code: 'SAVE20',
          course_id: 'course-1',
          user_id: 'user-1',
          amount: 1000
        });

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Coupon already used for this course');
      });

      it('should handle database errors gracefully', async () => {
        mockSupabaseClient.from = jest.fn(() => {
          throw new Error('Database error');
        });

        const result = await enrollmentService.validateCoupon({
          code: 'SAVE20',
          course_id: 'course-1',
          user_id: 'user-1',
          amount: 1000
        });

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Failed to validate coupon');
      });
    });

    describe('applyCoupon', () => {
      it('should apply valid coupon successfully', async () => {
        const mockCoupon = {
          id: 'coupon-123',
          code: 'SAVE20',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 10,
          usage_limit: 100,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        // Mock validation success
        mockSupabaseClient.from = jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockCoupon, error: null }))
              }))
            }))
          })
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: null, error: null })) // No previous usage
              }))
            }))
          })
          .mockReturnValueOnce({
            insert: jest.fn(() => ({ error: null })) // Record usage
          })
          .mockReturnValueOnce({
            update: jest.fn(() => ({
              eq: jest.fn(() => ({ error: null })) // Update usage count
            }))
          });

        const result = await enrollmentService.applyCoupon(
          'SAVE20',
          'user-1',
          'course-1',
          1000,
          'enrollment-123'
        );

        expect(result.originalAmount).toBe(1000);
        expect(result.discountAmount).toBe(200);
        expect(result.finalAmount).toBe(800);
        expect(result.coupon).toEqual(mockCoupon);
      });

      it('should handle coupon application with maximum discount', async () => {
        const mockCoupon = {
          id: 'coupon-123',
          code: 'SAVE50',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 50,
          min_amount: 0,
          max_discount: 300, // Maximum discount limit
          used_count: 5,
          usage_limit: 100,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        mockSupabaseClient.from = jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockCoupon, error: null }))
              }))
            }))
          })
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: null, error: null }))
              }))
            }))
          })
          .mockReturnValueOnce({
            insert: jest.fn(() => ({ error: null }))
          })
          .mockReturnValueOnce({
            update: jest.fn(() => ({
              eq: jest.fn(() => ({ error: null }))
            }))
          });

        const result = await enrollmentService.applyCoupon(
          'SAVE50',
          'user-1',
          'course-1',
          1000 // 50% would be 500, but max_discount is 300
        );

        expect(result.discountAmount).toBe(300); // Capped at max_discount
        expect(result.finalAmount).toBe(700);
      });

      it('should handle fixed amount coupon', async () => {
        const mockCoupon = {
          id: 'coupon-123',
          code: 'FLAT100',
          discount_type: CouponDiscountType.FIXED,
          discount_value: 100,
          min_amount: 0,
          used_count: 0,
          usage_limit: 50,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        mockSupabaseClient.from = jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockCoupon, error: null }))
              }))
            }))
          })
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: null, error: null }))
              }))
            }))
          })
          .mockReturnValueOnce({
            insert: jest.fn(() => ({ error: null }))
          })
          .mockReturnValueOnce({
            update: jest.fn(() => ({
              eq: jest.fn(() => ({ error: null }))
            }))
          });

        const result = await enrollmentService.applyCoupon(
          'FLAT100',
          'user-1',
          'course-1',
          1000
        );

        expect(result.discountAmount).toBe(100);
        expect(result.finalAmount).toBe(900);
      });

      it('should prevent applying invalid coupon', async () => {
        const mockCoupon = {
          id: 'coupon-123',
          code: 'EXPIRED',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2023-01-01'),
          valid_until: new Date('2023-12-31'), // Expired
          is_active: true,
          created_at: new Date()
        };

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockCoupon, error: null }))
            }))
          }))
        }));

        await expect(enrollmentService.applyCoupon(
          'EXPIRED',
          'user-1',
          'course-1',
          1000
        )).rejects.toThrow(APIError);
      });

      it('should handle database errors during coupon application', async () => {
        const mockCoupon = {
          id: 'coupon-123',
          code: 'SAVE20',
          discount_type: CouponDiscountType.PERCENTAGE,
          discount_value: 20,
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date()
        };

        mockSupabaseClient.from = jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockCoupon, error: null }))
              }))
            }))
          })
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: null, error: null }))
              }))
            }))
          })
          .mockReturnValueOnce({
            insert: jest.fn(() => ({ error: { message: 'Insert failed' } })) // Database error
          });

        await expect(enrollmentService.applyCoupon(
          'SAVE20',
          'user-1',
          'course-1',
          1000
        )).rejects.toThrow('Failed to record coupon usage');
      });
    });
  });

  describe('Complex Pricing Scenarios', () => {
    it('should handle multiple discount tiers correctly', () => {
      const scenarios = [
        {
          coupon: {
            discount_type: CouponDiscountType.PERCENTAGE,
            discount_value: 10,
            min_amount: 0
          },
          amount: 500,
          expectedDiscount: 50
        },
        {
          coupon: {
            discount_type: CouponDiscountType.PERCENTAGE,
            discount_value: 15,
            min_amount: 1000
          },
          amount: 1500,
          expectedDiscount: 225
        },
        {
          coupon: {
            discount_type: CouponDiscountType.PERCENTAGE,
            discount_value: 25,
            min_amount: 2000,
            max_discount: 400
          },
          amount: 2500,
          expectedDiscount: 400 // 25% of 2500 = 625, but capped at 400
        }
      ];

      scenarios.forEach(({ coupon, amount, expectedDiscount }) => {
        const mockCoupon = {
          id: 'test',
          code: 'TEST',
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date(),
          ...coupon
        } as Coupon;

        const discount = CouponUtils.calculateDiscount(mockCoupon, amount);
        expect(discount).toBe(expectedDiscount);
      });
    });

    it('should handle edge cases in pricing calculations', () => {
      const edgeCases = [
        {
          name: 'Zero amount with percentage coupon',
          coupon: { discount_type: CouponDiscountType.PERCENTAGE, discount_value: 50 },
          amount: 0,
          expected: 0
        },
        {
          name: 'Very small amount with fixed coupon',
          coupon: { discount_type: CouponDiscountType.FIXED, discount_value: 1000 },
          amount: 1,
          expected: 1 // Should not exceed original amount
        },
        {
          name: 'Large amount with percentage and max discount',
          coupon: { 
            discount_type: CouponDiscountType.PERCENTAGE, 
            discount_value: 90,
            max_discount: 100
          },
          amount: 10000,
          expected: 100 // 90% would be 9000, but capped at 100
        }
      ];

      edgeCases.forEach(({ name, coupon, amount, expected }) => {
        const mockCoupon = {
          id: 'test',
          code: 'TEST',
          min_amount: 0,
          used_count: 0,
          valid_from: new Date('2024-01-01'),
          is_active: true,
          created_at: new Date(),
          ...coupon
        } as Coupon;

        const discount = CouponUtils.calculateDiscount(mockCoupon, amount);
        expect(discount).toBe(expected);
      });
    });
  });
});