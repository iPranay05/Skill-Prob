import { z } from 'zod';

// Coupon discount type enum
export enum CouponDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

// Zod schemas for validation
export const CouponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/, 'Coupon code must contain only uppercase letters, numbers, hyphens, and underscores'),
  description: z.string().optional(),
  discount_type: z.nativeEnum(CouponDiscountType),
  discount_value: z.number().min(0),
  min_amount: z.number().min(0).default(0),
  max_discount: z.number().min(0).optional(),
  usage_limit: z.number().min(1).optional(),
  used_count: z.number().min(0).default(0),
  valid_from: z.date().default(() => new Date()),
  valid_until: z.date().optional(),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().optional(),
  created_at: z.date().default(() => new Date())
});

// TypeScript interface
export interface Coupon {
  id?: string;
  code: string;
  description?: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_amount: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  valid_from: Date;
  valid_until?: Date;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
}

// DTOs for API operations
export const CreateCouponSchema = CouponSchema.omit({
  id: true,
  created_at: true,
  used_count: true
});

export const UpdateCouponSchema = CreateCouponSchema.partial();

export const ValidateCouponSchema = z.object({
  code: z.string(),
  course_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  amount: z.number().min(0)
});

export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
export type UpdateCouponInput = z.infer<typeof UpdateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;

// Coupon validation result
export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  finalAmount: number;
  error?: string;
}

// Coupon application result
export interface CouponApplicationResult {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  coupon: Coupon;
}

// Coupon query types
export interface CouponFilters {
  is_active?: boolean;
  discount_type?: CouponDiscountType;
  created_by?: string;
  valid_only?: boolean; // Only return coupons that are currently valid
}

export interface CouponQuery {
  search?: string;
  filters?: CouponFilters;
  sortBy?: 'created_at' | 'valid_until' | 'used_count' | 'discount_value';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Coupon statistics
export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalUsage: number;
  totalDiscountGiven: number;
  topCoupons: {
    code: string;
    usage_count: number;
    total_discount: number;
  }[];
}

// Coupon utility functions
export class CouponUtils {
  /**
   * Calculate discount amount based on coupon type and value
   */
  static calculateDiscount(
    coupon: Coupon,
    amount: number
  ): number {
    let discount = 0;

    if (coupon.discount_type === CouponDiscountType.PERCENTAGE) {
      discount = (amount * coupon.discount_value) / 100;
    } else if (coupon.discount_type === CouponDiscountType.FIXED) {
      discount = coupon.discount_value;
    }

    // Apply maximum discount limit if set
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }

    // Ensure discount doesn't exceed the original amount
    return Math.min(discount, amount);
  }

  /**
   * Check if coupon is currently valid (date-wise)
   */
  static isDateValid(coupon: Coupon): boolean {
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    return now >= validFrom && (!validUntil || now <= validUntil);
  }

  /**
   * Check if coupon has usage limit and is within limit
   */
  static isUsageLimitValid(coupon: Coupon): boolean {
    if (!coupon.usage_limit) return true;
    return coupon.used_count < coupon.usage_limit;
  }

  /**
   * Check if amount meets minimum requirement
   */
  static meetsMinimumAmount(coupon: Coupon, amount: number): boolean {
    return amount >= coupon.min_amount;
  }

  /**
   * Generate a random coupon code
   */
  static generateCouponCode(prefix?: string, length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix ? `${prefix}_` : '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Validate coupon comprehensively
   */
  static validateCoupon(
    coupon: Coupon,
    amount: number,
    userId?: string
  ): { isValid: boolean; error?: string } {
    if (!coupon.is_active) {
      return { isValid: false, error: 'Coupon is not active' };
    }

    if (!this.isDateValid(coupon)) {
      return { isValid: false, error: 'Coupon has expired or is not yet valid' };
    }

    if (!this.isUsageLimitValid(coupon)) {
      return { isValid: false, error: 'Coupon usage limit exceeded' };
    }

    if (!this.meetsMinimumAmount(coupon, amount)) {
      return { 
        isValid: false, 
        error: `Minimum amount of ${coupon.min_amount} ${coupon.min_amount > 0 ? 'required' : ''}` 
      };
    }

    return { isValid: true };
  }
}