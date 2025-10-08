import { createClient } from '@supabase/supabase-js';
import {
  CourseEnrollment,
  Subscription,
  Payment,
  CouponUsage,
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  CreatePaymentInput,
  EnrollmentStatus,
  SubscriptionStatus,
  PaymentStatus,
  EnrollmentQuery,
  SubscriptionQuery,
  EnrollmentStats,
  CourseCapacity,
  CourseEnrollmentSchema,
  SubscriptionSchema,
  PaymentSchema
} from '../models/Enrollment';
import {
  Coupon,
  CouponValidationResult,
  CouponApplicationResult,
  CouponUtils,
  ValidateCouponInput
} from '../models/Coupon';
import { APIError } from './errors';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class EnrollmentService {
  constructor() {
    // No initialization needed for Supabase
  }

  /**
   * Enroll a student in a course
   */
  async enrollStudent(enrollmentData: CreateEnrollmentInput): Promise<CourseEnrollment> {
    try {
      // Validate input
      const validatedData = CourseEnrollmentSchema.omit({
        id: true,
        created_at: true,
        updated_at: true,
        enrollment_date: true
      }).parse(enrollmentData);

      // Check if student is already enrolled
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', validatedData.course_id)
        .eq('student_id', validatedData.student_id)
        .single();

      if (existingEnrollment) {
        throw new APIError('Student is already enrolled in this course', 409);
      }

      // Check course capacity
      const capacity = await this.getCourseCapacity(validatedData.course_id);
      if (capacity.is_full) {
        throw new APIError('Course enrollment capacity exceeded', 400);
      }

      // Create enrollment
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          ...validatedData,
          enrollment_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create enrollment', 500, 'ENROLLMENT_ERROR', error);
      }

      return data as CourseEnrollment;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to enroll student', 500, 'ENROLLMENT_ERROR', error);
    }
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string): Promise<CourseEnrollment | null> {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses:course_id (title, mentor_id),
          users:student_id (email, profile)
        `)
        .eq('id', enrollmentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new APIError('Failed to fetch enrollment', 500, 'FETCH_ERROR', error);
      }

      return data as CourseEnrollment | null;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch enrollment', 500, 'FETCH_ERROR', error);
    }
  }

  /**
   * Get student enrollments
   */
  async getStudentEnrollments(
    studentId: string,
    query: EnrollmentQuery = {}
  ): Promise<{
    enrollments: CourseEnrollment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        filters = {},
        sortBy = 'enrollment_date',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = query;

      let supabaseQuery = supabase
        .from('course_enrollments')
        .select(`
          *,
          courses:course_id (title, description, mentor_id, media, type)
        `, { count: 'exact' })
        .eq('student_id', studentId);

      // Apply filters
      if (filters.status) {
        supabaseQuery = supabaseQuery.eq('status', filters.status);
      }

      if (filters.course_id) {
        supabaseQuery = supabaseQuery.eq('course_id', filters.course_id);
      }

      if (filters.enrollment_source) {
        supabaseQuery = supabaseQuery.eq('enrollment_source', filters.enrollment_source);
      }

      if (filters.date_from) {
        supabaseQuery = supabaseQuery.gte('enrollment_date', filters.date_from.toISOString());
      }

      if (filters.date_to) {
        supabaseQuery = supabaseQuery.lte('enrollment_date', filters.date_to.toISOString());
      }

      // Sorting
      supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const offset = (page - 1) * limit;
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw new APIError('Failed to fetch enrollments', 500, 'FETCH_ERROR', error);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        enrollments: data as CourseEnrollment[],
        total: count || 0,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch enrollments', 500, 'FETCH_ERROR', error);
    }
  }

  /**
   * Get course enrollments (for mentors/admins)
   */
  async getCourseEnrollments(
    courseId: string,
    query: EnrollmentQuery = {}
  ): Promise<{
    enrollments: CourseEnrollment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        filters = {},
        sortBy = 'enrollment_date',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = query;

      let supabaseQuery = supabase
        .from('course_enrollments')
        .select(`
          *,
          users:student_id (email, profile)
        `, { count: 'exact' })
        .eq('course_id', courseId);

      // Apply filters
      if (filters.status) {
        supabaseQuery = supabaseQuery.eq('status', filters.status);
      }

      if (filters.enrollment_source) {
        supabaseQuery = supabaseQuery.eq('enrollment_source', filters.enrollment_source);
      }

      if (filters.date_from) {
        supabaseQuery = supabaseQuery.gte('enrollment_date', filters.date_from.toISOString());
      }

      if (filters.date_to) {
        supabaseQuery = supabaseQuery.lte('enrollment_date', filters.date_to.toISOString());
      }

      // Sorting
      supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const offset = (page - 1) * limit;
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw new APIError('Failed to fetch course enrollments', 500, 'FETCH_ERROR', error);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        enrollments: data as CourseEnrollment[],
        total: count || 0,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch course enrollments', 500, 'FETCH_ERROR', error);
    }
  }

  /**
   * Update enrollment status
   */
  async updateEnrollmentStatus(
    enrollmentId: string,
    status: EnrollmentStatus,
    userId: string
  ): Promise<CourseEnrollment> {
    try {
      // Verify user has permission to update this enrollment
      const { data: enrollment, error: fetchError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses:course_id (mentor_id)
        `)
        .eq('id', enrollmentId)
        .single();

      if (fetchError) {
        throw new APIError('Enrollment not found', 404);
      }

      // Check if user is the student or the mentor or admin
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const isStudent = enrollment.student_id === userId;
      const isMentor = (enrollment as any).courses?.mentor_id === userId;
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

      if (!isStudent && !isMentor && !isAdmin) {
        throw new APIError('Unauthorized to update this enrollment', 403);
      }

      // Update enrollment
      const { data, error } = await supabase
        .from('course_enrollments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to update enrollment', 500, 'UPDATE_ERROR', error);
      }

      return data as CourseEnrollment;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update enrollment', 500, 'UPDATE_ERROR', error);
    }
  }

  /**
   * Update enrollment progress
   */
  async updateEnrollmentProgress(
    enrollmentId: string,
    studentId: string,
    progressUpdate: {
      completedSessions?: string[];
      totalSessions?: number;
      completionPercentage?: number;
      lastSessionCompleted?: string;
      timeSpent?: number;
    }
  ): Promise<CourseEnrollment> {
    try {
      // Get current enrollment
      const { data: enrollment, error: fetchError } = await supabase
        .from('course_enrollments')
        .select('progress')
        .eq('id', enrollmentId)
        .eq('student_id', studentId)
        .single();

      if (fetchError) {
        throw new APIError('Enrollment not found or unauthorized', 404);
      }

      // Merge progress data
      const currentProgress = enrollment.progress as any || {};
      const updatedProgress = {
        ...currentProgress,
        ...progressUpdate,
        completedSessions: progressUpdate.completedSessions || currentProgress.completedSessions || [],
        totalSessions: progressUpdate.totalSessions || currentProgress.totalSessions || 0,
        completionPercentage: progressUpdate.completionPercentage || currentProgress.completionPercentage || 0,
        timeSpent: (currentProgress.timeSpent || 0) + (progressUpdate.timeSpent || 0)
      };

      // Update enrollment
      const { data, error } = await supabase
        .from('course_enrollments')
        .update({
          progress: updatedProgress,
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId)
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to update progress', 500, 'UPDATE_ERROR', error);
      }

      return data as CourseEnrollment;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update progress', 500, 'UPDATE_ERROR', error);
    }
  }

  /**
   * Get course capacity information
   */
  async getCourseCapacity(courseId: string): Promise<CourseCapacity> {
    try {
      // Get capacity from course_capacity table
      const { data: capacity, error: capacityError } = await supabase
        .from('course_capacity')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (capacityError && capacityError.code !== 'PGRST116') {
        throw new APIError('Failed to fetch course capacity', 500, 'FETCH_ERROR', capacityError);
      }

      // If no capacity record, get from course table
      if (!capacity) {
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('enrollment')
          .eq('id', courseId)
          .single();

        if (courseError) {
          throw new APIError('Course not found', 404);
        }

        const enrollment = course.enrollment as any;
        return {
          course_id: courseId,
          max_students: enrollment.maxStudents,
          current_enrollment: enrollment.currentEnrollment || 0,
          waitlist_count: 0,
          available_spots: enrollment.maxStudents ? enrollment.maxStudents - (enrollment.currentEnrollment || 0) : undefined,
          is_full: enrollment.maxStudents ? (enrollment.currentEnrollment || 0) >= enrollment.maxStudents : false
        };
      }

      return {
        course_id: capacity.course_id,
        max_students: capacity.max_students,
        current_enrollment: capacity.current_enrollment,
        waitlist_count: capacity.waitlist_count,
        available_spots: capacity.max_students ? capacity.max_students - capacity.current_enrollment : undefined,
        is_full: capacity.max_students ? capacity.current_enrollment >= capacity.max_students : false
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch course capacity', 500, 'FETCH_ERROR', error);
    }
  }

  /**
   * Validate coupon for course enrollment
   */
  async validateCoupon(validationData: ValidateCouponInput): Promise<CouponValidationResult> {
    try {
      const { code, course_id, user_id, amount } = validationData;

      // Get coupon
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (couponError || !coupon) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: amount,
          error: 'Invalid coupon code'
        };
      }

      // Validate coupon
      const validation = CouponUtils.validateCoupon(coupon as Coupon, amount, user_id);
      if (!validation.isValid) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: amount,
          error: validation.error
        };
      }

      // Check if user has already used this coupon for this course
      if (course_id) {
        const { data: usage } = await supabase
          .from('coupon_usage')
          .select('id')
          .eq('coupon_id', coupon.id)
          .eq('user_id', user_id)
          .eq('course_id', course_id)
          .single();

        if (usage) {
          return {
            isValid: false,
            discountAmount: 0,
            finalAmount: amount,
            error: 'Coupon already used for this course'
          };
        }
      }

      // Calculate discount
      const discountAmount = CouponUtils.calculateDiscount(coupon as Coupon, amount);
      const finalAmount = amount - discountAmount;

      return {
        isValid: true,
        coupon: coupon as Coupon,
        discountAmount,
        finalAmount
      };
    } catch (error) {
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: validationData.amount,
        error: 'Failed to validate coupon'
      };
    }
  }

  /**
   * Apply coupon to enrollment
   */
  async applyCoupon(
    couponCode: string,
    userId: string,
    courseId: string,
    originalAmount: number,
    enrollmentId?: string
  ): Promise<CouponApplicationResult> {
    try {
      // Validate coupon first
      const validation = await this.validateCoupon({
        code: couponCode,
        course_id: courseId,
        user_id: userId,
        amount: originalAmount
      });

      if (!validation.isValid || !validation.coupon) {
        throw new APIError(validation.error || 'Invalid coupon', 400);
      }

      // Record coupon usage
      const { error: usageError } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id: validation.coupon.id,
          user_id: userId,
          course_id: courseId,
          enrollment_id: enrollmentId,
          discount_amount: validation.discountAmount,
          original_amount: originalAmount,
          final_amount: validation.finalAmount
        });

      if (usageError) {
        throw new APIError('Failed to record coupon usage', 500, 'COUPON_ERROR', usageError);
      }

      // Update coupon usage count
      const { error: updateError } = await supabase
        .from('coupons')
        .update({
          used_count: validation.coupon.used_count + 1
        })
        .eq('id', validation.coupon.id);

      if (updateError) {
        throw new APIError('Failed to update coupon usage', 500, 'COUPON_ERROR', updateError);
      }

      return {
        originalAmount,
        discountAmount: validation.discountAmount,
        finalAmount: validation.finalAmount,
        coupon: validation.coupon
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to apply coupon', 500, 'COUPON_ERROR', error);
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(subscriptionData: CreateSubscriptionInput): Promise<Subscription> {
    try {
      const validatedData = SubscriptionSchema.omit({
        id: true,
        created_at: true,
        updated_at: true
      }).parse(subscriptionData);

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create subscription', 500, 'SUBSCRIPTION_ERROR', error);
      }

      return data as Subscription;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to create subscription', 500, 'SUBSCRIPTION_ERROR', error);
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
    cancellationReason?: string
  ): Promise<Subscription> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === SubscriptionStatus.CANCELLED) {
        updateData.cancelled_at = new Date().toISOString();
        if (cancellationReason) {
          updateData.cancellation_reason = cancellationReason;
        }
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to update subscription', 500, 'SUBSCRIPTION_ERROR', error);
      }

      return data as Subscription;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update subscription', 500, 'SUBSCRIPTION_ERROR', error);
    }
  }

  /**
   * Create payment record
   */
  async createPayment(paymentData: CreatePaymentInput): Promise<Payment> {
    try {
      const validatedData = PaymentSchema.omit({
        id: true,
        created_at: true,
        updated_at: true
      }).parse(paymentData);

      const { data, error } = await supabase
        .from('payments')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create payment', 500, 'PAYMENT_ERROR', error);
      }

      return data as Payment;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to create payment', 500, 'PAYMENT_ERROR', error);
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    gatewayPaymentId?: string,
    failureReason?: string
  ): Promise<Payment> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === PaymentStatus.COMPLETED) {
        updateData.payment_date = new Date().toISOString();
        if (gatewayPaymentId) {
          updateData.gateway_payment_id = gatewayPaymentId;
        }
      } else if (status === PaymentStatus.FAILED && failureReason) {
        updateData.failure_reason = failureReason;
      }

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to update payment', 500, 'PAYMENT_ERROR', error);
      }

      return data as Payment;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update payment', 500, 'PAYMENT_ERROR', error);
    }
  }

  /**
   * Get enrollment statistics
   */
  async getEnrollmentStats(
    filters: {
      course_id?: string;
      mentor_id?: string;
      date_from?: Date;
      date_to?: Date;
    } = {}
  ): Promise<EnrollmentStats> {
    try {
      let query = supabase
        .from('course_enrollments')
        .select(`
          *,
          courses:course_id (mentor_id)
        `);

      // Apply filters
      if (filters.course_id) {
        query = query.eq('course_id', filters.course_id);
      }

      if (filters.date_from) {
        query = query.gte('enrollment_date', filters.date_from.toISOString());
      }

      if (filters.date_to) {
        query = query.lte('enrollment_date', filters.date_to.toISOString());
      }

      const { data: enrollments, error } = await query;

      if (error) {
        throw new APIError('Failed to fetch enrollment stats', 500, 'STATS_ERROR', error);
      }

      // Filter by mentor if specified
      let filteredEnrollments = enrollments || [];
      if (filters.mentor_id) {
        filteredEnrollments = filteredEnrollments.filter(
          (enrollment: any) => enrollment.courses?.mentor_id === filters.mentor_id
        );
      }

      // Calculate statistics
      const totalEnrollments = filteredEnrollments.length;
      const activeEnrollments = filteredEnrollments.filter(
        (e: any) => e.status === EnrollmentStatus.ACTIVE
      ).length;
      const completedEnrollments = filteredEnrollments.filter(
        (e: any) => e.status === EnrollmentStatus.COMPLETED
      ).length;
      const totalRevenue = filteredEnrollments.reduce(
        (sum: number, e: any) => sum + (e.amount_paid || 0),
        0
      );

      // Calculate completion rate
      const enrollmentsWithProgress = filteredEnrollments.filter(
        (e: any) => e.progress?.completionPercentage !== undefined
      );
      const averageCompletionRate = enrollmentsWithProgress.length > 0
        ? enrollmentsWithProgress.reduce(
            (sum: number, e: any) => sum + (e.progress?.completionPercentage || 0),
            0
          ) / enrollmentsWithProgress.length
        : 0;

      // Group by month for trend analysis
      const enrollmentsByMonth: { [key: string]: { count: number; revenue: number } } = {};
      filteredEnrollments.forEach((enrollment: any) => {
        const month = new Date(enrollment.enrollment_date).toISOString().substring(0, 7);
        if (!enrollmentsByMonth[month]) {
          enrollmentsByMonth[month] = { count: 0, revenue: 0 };
        }
        enrollmentsByMonth[month].count++;
        enrollmentsByMonth[month].revenue += enrollment.amount_paid || 0;
      });

      const enrollmentsByMonthArray = Object.entries(enrollmentsByMonth)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        totalRevenue,
        averageCompletionRate,
        enrollmentsByMonth: enrollmentsByMonthArray
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to calculate enrollment stats', 500, 'STATS_ERROR', error);
    }
  }
}