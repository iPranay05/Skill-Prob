import { createClient } from '@supabase/supabase-js';
import {
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
  CouponQuery,
  CouponStats,
  CouponUtils,
  CouponSchema,
  CouponDiscountType
} from '../models/Coupon';
import { APIError } from './errors';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class CouponService {
  constructor() {
    // No initialization needed for Supabase
  }

  /**
   * Create a new coupon
   */
  async createCoupon(couponData: CreateCouponInput, createdBy: string): Promise<Coupon> {
    try {
      // Validate input
      const validatedData = CouponSchema.omit({
        id: true,
        created_at: true,
        used_count: true
      }).parse({
        ...couponData,
        code: couponData.code.toUpperCase(), // Ensure uppercase
        created_by: createdBy
      });

      // Check if coupon code already exists
      const { data: existingCoupon } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', validatedData.code)
        .single();

      if (existingCoupon) {
        throw new APIError('Coupon code already exists', 409);
      }

      // Create coupon
      const { data, error } = await supabase
        .from('coupons')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create coupon', 500, 'COUPON_ERROR', error);
      }

      return data as Coupon;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to create coupon', 500, 'COUPON_ERROR', error);
    }
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(couponId: string): Promise<Coupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new APIError('Failed to fetch coupon', 500, 'FETCH_ERROR', error);
      }

      return data as Coupon | null;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch coupon', 500, 'FETCH_ERROR', error);
    }
  }

  /**
   * Get coupon by code
   */
  async getCouponByCode(code: string): Promise<Coupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new APIError('Failed to fetch coupon', 500, 'FETCH_ERROR', error);
      }

      return data as Coupon | null;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch coupon', 500, 'FETCH_ERROR', error);
    }
  }

  /**
   * Search and filter coupons
   */
  async searchCoupons(query: CouponQuery): Promise<{
    coupons: Coupon[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        search,
        filters = {},
        sortBy = 'created_at',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = query;

      let supabaseQuery = supabase.from('coupons').select('*', { count: 'exact' });

      // Apply filters
      if (filters.is_active !== undefined) {
        supabaseQuery = supabaseQuery.eq('is_active', filters.is_active);
      }

      if (filters.discount_type) {
        supabaseQuery = supabaseQuery.eq('discount_type', filters.discount_type);
      }

      if (filters.created_by) {
        supabaseQuery = supabaseQuery.eq('created_by', filters.created_by);
      }

      if (filters.valid_only) {
        const now = new Date().toISOString();
        supabaseQuery = supabaseQuery
          .lte('valid_from', now)
          .or(`valid_until.is.null,valid_until.gte.${now}`);
      }

      // Text search
      if (search) {
        supabaseQuery = supabaseQuery.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Sorting
      supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const offset = (page - 1) * limit;
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw new APIError('Failed to search coupons', 500, 'SEARCH_ERROR', error);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        coupons: data as Coupon[],
        total: count || 0,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to search coupons', 500, 'SEARCH_ERROR', error);
    }
  }

  /**
   * Update coupon
   */
  async updateCoupon(
    couponId: string,
    updateData: UpdateCouponInput,
    userId: string
  ): Promise<Coupon> {
    try {
      // Check if user has permission to update this coupon
      const { data: coupon, error: fetchError } = await supabase
        .from('coupons')
        .select('created_by')
        .eq('id', couponId)
        .single();

      if (fetchError) {
        throw new APIError('Coupon not found', 404);
      }

      // Check if user is admin or the creator
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isCreator = coupon.created_by === userId;

      if (!isAdmin && !isCreator) {
        throw new APIError('Unauthorized to update this coupon', 403);
      }

      // Validate update data
      const validatedData = CouponSchema.omit({
        id: true,
        created_at: true,
        used_count: true,
        created_by: true
      }).partial().parse(updateData);

      // Ensure code is uppercase if provided
      if (validatedData.code) {
        validatedData.code = validatedData.code.toUpperCase();

        // Check if new code already exists (excluding current coupon)
        const { data: existingCoupon } = await supabase
          .from('coupons')
          .select('id')
          .eq('code', validatedData.code)
          .neq('id', couponId)
          .single();

        if (existingCoupon) {
          throw new APIError('Coupon code already exists', 409);
        }
      }

      // Update coupon
      const { data, error } = await supabase
        .from('coupons')
        .update(validatedData)
        .eq('id', couponId)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to update coupon', 500, 'UPDATE_ERROR', error);
      }

      return data as Coupon;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update coupon', 500, 'UPDATE_ERROR', error);
    }
  }

  /**
   * Delete coupon
   */
  async deleteCoupon(couponId: string, userId: string): Promise<boolean> {
    try {
      // Check if user has permission to delete this coupon
      const { data: coupon, error: fetchError } = await supabase
        .from('coupons')
        .select('created_by, used_count')
        .eq('id', couponId)
        .single();

      if (fetchError) {
        throw new APIError('Coupon not found', 404);
      }

      // Check if user is admin or the creator
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isCreator = coupon.created_by === userId;

      if (!isAdmin && !isCreator) {
        throw new APIError('Unauthorized to delete this coupon', 403);
      }

      // Check if coupon has been used
      if (coupon.used_count > 0) {
        throw new APIError('Cannot delete coupon that has been used', 400);
      }

      // Delete coupon
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) {
        throw new APIError('Failed to delete coupon', 500, 'DELETE_ERROR', error);
      }

      return true;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to delete coupon', 500, 'DELETE_ERROR', error);
    }
  }

  /**
   * Activate/Deactivate coupon
   */
  async toggleCouponStatus(couponId: string, userId: string): Promise<Coupon> {
    try {
      // Get current coupon
      const { data: coupon, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single();

      if (fetchError) {
        throw new APIError('Coupon not found', 404);
      }

      // Check permissions
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isCreator = coupon.created_by === userId;

      if (!isAdmin && !isCreator) {
        throw new APIError('Unauthorized to modify this coupon', 403);
      }

      // Toggle status
      const { data, error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', couponId)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to update coupon status', 500, 'UPDATE_ERROR', error);
      }

      return data as Coupon;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update coupon status', 500, 'UPDATE_ERROR', error);
    }
  }

  /**
   * Get coupon usage statistics
   */
  async getCouponStats(filters: { created_by?: string; date_from?: Date; date_to?: Date } = {}): Promise<CouponStats> {
    try {
      let couponQuery = supabase.from('coupons').select('*');
      let usageQuery = supabase.from('coupon_usage').select(`
        *,
        coupons:coupon_id (code)
      `);

      // Apply filters
      if (filters.created_by) {
        couponQuery = couponQuery.eq('created_by', filters.created_by);
      }

      if (filters.date_from) {
        couponQuery = couponQuery.gte('created_at', filters.date_from.toISOString());
        usageQuery = usageQuery.gte('used_at', filters.date_from.toISOString());
      }

      if (filters.date_to) {
        couponQuery = couponQuery.lte('created_at', filters.date_to.toISOString());
        usageQuery = usageQuery.lte('used_at', filters.date_to.toISOString());
      }

      const [{ data: coupons, error: couponError }, { data: usage, error: usageError }] = await Promise.all([
        couponQuery,
        usageQuery
      ]);

      if (couponError) {
        throw new APIError('Failed to fetch coupons', 500, 'STATS_ERROR', couponError);
      }

      if (usageError) {
        throw new APIError('Failed to fetch coupon usage', 500, 'STATS_ERROR', usageError);
      }

      // Calculate statistics
      const totalCoupons = coupons?.length || 0;
      const activeCoupons = coupons?.filter(c => c.is_active).length || 0;
      const totalUsage = usage?.length || 0;
      const totalDiscountGiven = usage?.reduce((sum, u) => sum + (u.discount_amount || 0), 0) || 0;

      // Calculate top coupons by usage
      const couponUsageMap: { [code: string]: { usage_count: number; total_discount: number } } = {};
      
      usage?.forEach((u: any) => {
        const code = u.coupons?.code;
        if (code) {
          if (!couponUsageMap[code]) {
            couponUsageMap[code] = { usage_count: 0, total_discount: 0 };
          }
          couponUsageMap[code].usage_count++;
          couponUsageMap[code].total_discount += u.discount_amount || 0;
        }
      });

      const topCoupons = Object.entries(couponUsageMap)
        .map(([code, stats]) => ({ code, ...stats }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10);

      return {
        totalCoupons,
        activeCoupons,
        totalUsage,
        totalDiscountGiven,
        topCoupons
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to calculate coupon stats', 500, 'STATS_ERROR', error);
    }
  }

  /**
   * Get coupon usage history
   */
  async getCouponUsageHistory(
    couponId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    usage: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('coupon_usage')
        .select(`
          *,
          users:user_id (email, profile),
          courses:course_id (title),
          course_enrollments:enrollment_id (enrollment_date)
        `, { count: 'exact' })
        .eq('coupon_id', couponId)
        .order('used_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new APIError('Failed to fetch coupon usage history', 500, 'FETCH_ERROR', error);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        usage: data || [],
        total: count || 0,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch coupon usage history', 500, 'FETCH_ERROR', error);
    }
  }

  /**
   * Generate unique coupon code
   */
  async generateUniqueCouponCode(prefix?: string, length: number = 8): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = CouponUtils.generateCouponCode(prefix, length);
      
      // Check if code exists
      const { data } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', code)
        .single();

      if (!data) {
        return code;
      }

      attempts++;
    }

    throw new APIError('Failed to generate unique coupon code', 500);
  }

  /**
   * Bulk create coupons
   */
  async bulkCreateCoupons(
    couponTemplate: Omit<CreateCouponInput, 'code'>,
    codes: string[],
    createdBy: string
  ): Promise<Coupon[]> {
    try {
      // Validate all codes are unique and don't exist
      const upperCaseCodes = codes.map(code => code.toUpperCase());
      const uniqueCodes = [...new Set(upperCaseCodes)];

      if (uniqueCodes.length !== codes.length) {
        throw new APIError('Duplicate codes in the list', 400);
      }

      // Check if any codes already exist
      const { data: existingCoupons } = await supabase
        .from('coupons')
        .select('code')
        .in('code', uniqueCodes);

      if (existingCoupons && existingCoupons.length > 0) {
        const existingCodes = existingCoupons.map(c => c.code);
        throw new APIError(`Coupon codes already exist: ${existingCodes.join(', ')}`, 409);
      }

      // Create coupons
      const couponsToCreate = uniqueCodes.map(code => ({
        ...couponTemplate,
        code,
        created_by: createdBy
      }));

      const { data, error } = await supabase
        .from('coupons')
        .insert(couponsToCreate)
        .select();

      if (error) {
        throw new APIError('Failed to create coupons', 500, 'BULK_CREATE_ERROR', error);
      }

      return data as Coupon[];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to bulk create coupons', 500, 'BULK_CREATE_ERROR', error);
    }
  }
}