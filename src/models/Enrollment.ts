import { z } from 'zod';

// Enrollment status enum
export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

// Subscription status enum
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PAUSED = 'paused'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Zod schemas for validation
export const EnrollmentProgressSchema = z.object({
  completedSessions: z.array(z.string()).default([]),
  totalSessions: z.number().default(0),
  completionPercentage: z.number().min(0).max(100).default(0),
  lastSessionCompleted: z.string().optional(),
  timeSpent: z.number().default(0) // in minutes
});

export const CourseEnrollmentSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  student_id: z.string().uuid(),
  enrollment_date: z.date().default(() => new Date()),
  status: z.nativeEnum(EnrollmentStatus).default(EnrollmentStatus.ACTIVE),
  
  // Payment information
  amount_paid: z.number().min(0),
  currency: z.string().default('INR'),
  payment_method: z.string().optional(),
  transaction_id: z.string().optional(),
  
  // Subscription details
  subscription_id: z.string().uuid().optional(),
  
  // Progress tracking
  progress: EnrollmentProgressSchema.default(() => ({
    completedSessions: [],
    totalSessions: 0,
    completionPercentage: 0,
    timeSpent: 0
  })),
  
  // Access control
  access_expires_at: z.date().optional(),
  last_accessed_at: z.date().optional(),
  
  // Metadata
  enrollment_source: z.string().default('direct'),
  referral_code: z.string().optional(),
  coupon_code: z.string().optional(),
  
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

export const SubscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  course_id: z.string().uuid(),
  
  // Subscription details
  subscription_type: z.string(),
  status: z.nativeEnum(SubscriptionStatus).default(SubscriptionStatus.ACTIVE),
  
  // Pricing
  amount: z.number().min(0),
  currency: z.string().default('INR'),
  
  // Billing cycle
  billing_cycle: z.enum(['monthly', 'yearly']),
  current_period_start: z.date(),
  current_period_end: z.date(),
  
  // Payment gateway details
  gateway_subscription_id: z.string().optional(),
  gateway_customer_id: z.string().optional(),
  
  // Renewal tracking
  auto_renew: z.boolean().default(true),
  next_billing_date: z.date().optional(),
  failed_payment_count: z.number().default(0),
  
  // Cancellation
  cancelled_at: z.date().optional(),
  cancellation_reason: z.string().optional(),
  
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

export const PaymentSchema = z.object({
  id: z.string().uuid().optional(),
  enrollment_id: z.string().uuid().optional(),
  subscription_id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  
  // Payment details
  amount: z.number().min(0),
  currency: z.string().default('INR'),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  
  // Gateway information
  gateway: z.string(),
  gateway_payment_id: z.string().optional(),
  gateway_order_id: z.string().optional(),
  
  // Payment method
  payment_method: z.string().optional(),
  payment_method_details: z.record(z.string(), z.any()).optional(),
  
  // Coupon/discount applied
  coupon_code: z.string().optional(),
  discount_amount: z.number().default(0),
  
  // Metadata
  payment_date: z.date().optional(),
  failure_reason: z.string().optional(),
  refund_amount: z.number().default(0),
  refund_date: z.date().optional(),
  
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

export const CouponUsageSchema = z.object({
  id: z.string().uuid().optional(),
  coupon_id: z.string().uuid(),
  user_id: z.string().uuid(),
  course_id: z.string().uuid().optional(),
  enrollment_id: z.string().uuid().optional(),
  
  // Usage details
  discount_amount: z.number().min(0),
  original_amount: z.number().min(0),
  final_amount: z.number().min(0),
  
  used_at: z.date().default(() => new Date())
});

// TypeScript interfaces
export interface EnrollmentProgress {
  completedSessions: string[];
  totalSessions: number;
  completionPercentage: number;
  lastSessionCompleted?: string;
  timeSpent: number;
}

export interface CourseEnrollment {
  id?: string;
  course_id: string;
  student_id: string;
  enrollment_date: Date;
  status: EnrollmentStatus;
  
  // Payment information
  amount_paid: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  
  // Subscription details
  subscription_id?: string;
  
  // Progress tracking
  progress: EnrollmentProgress;
  
  // Access control
  access_expires_at?: Date;
  last_accessed_at?: Date;
  
  // Metadata
  enrollment_source: string;
  referral_code?: string;
  coupon_code?: string;
  
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id?: string;
  student_id: string;
  course_id: string;
  
  // Subscription details
  subscription_type: string;
  status: SubscriptionStatus;
  
  // Pricing
  amount: number;
  currency: string;
  
  // Billing cycle
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: Date;
  current_period_end: Date;
  
  // Payment gateway details
  gateway_subscription_id?: string;
  gateway_customer_id?: string;
  
  // Renewal tracking
  auto_renew: boolean;
  next_billing_date?: Date;
  failed_payment_count: number;
  
  // Cancellation
  cancelled_at?: Date;
  cancellation_reason?: string;
  
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id?: string;
  enrollment_id?: string;
  subscription_id?: string;
  student_id: string;
  
  // Payment details
  amount: number;
  currency: string;
  status: PaymentStatus;
  
  // Gateway information
  gateway: string;
  gateway_payment_id?: string;
  gateway_order_id?: string;
  
  // Payment method
  payment_method?: string;
  payment_method_details?: Record<string, any>;
  
  // Coupon/discount applied
  coupon_code?: string;
  discount_amount: number;
  
  // Metadata
  payment_date?: Date;
  failure_reason?: string;
  refund_amount: number;
  refund_date?: Date;
  
  created_at: Date;
  updated_at: Date;
}

export interface CouponUsage {
  id?: string;
  coupon_id: string;
  user_id: string;
  course_id?: string;
  enrollment_id?: string;
  
  // Usage details
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  
  used_at: Date;
}

// DTOs for API operations
export const CreateEnrollmentSchema = CourseEnrollmentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  enrollment_date: true,
  progress: true
}).extend({
  progress: EnrollmentProgressSchema.optional()
});

export const UpdateEnrollmentSchema = CreateEnrollmentSchema.partial();

export const CreateSubscriptionSchema = SubscriptionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateSubscriptionSchema = CreateSubscriptionSchema.partial();

export const CreatePaymentSchema = PaymentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdatePaymentSchema = CreatePaymentSchema.partial();

export type CreateEnrollmentInput = z.infer<typeof CreateEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof UpdateEnrollmentSchema>;
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;

// Enrollment query types
export interface EnrollmentFilters {
  course_id?: string;
  student_id?: string;
  status?: EnrollmentStatus;
  enrollment_source?: string;
  date_from?: Date;
  date_to?: Date;
}

export interface EnrollmentQuery {
  filters?: EnrollmentFilters;
  sortBy?: 'enrollment_date' | 'amount_paid' | 'progress';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Subscription query types
export interface SubscriptionFilters {
  student_id?: string;
  course_id?: string;
  status?: SubscriptionStatus;
  billing_cycle?: 'monthly' | 'yearly';
  auto_renew?: boolean;
}

export interface SubscriptionQuery {
  filters?: SubscriptionFilters;
  sortBy?: 'created_at' | 'next_billing_date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Enrollment statistics
export interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalRevenue: number;
  averageCompletionRate: number;
  enrollmentsByMonth: { month: string; count: number; revenue: number }[];
}

// Course capacity information
export interface CourseCapacity {
  course_id: string;
  max_students?: number;
  current_enrollment: number;
  waitlist_count: number;
  available_spots?: number;
  is_full: boolean;
}