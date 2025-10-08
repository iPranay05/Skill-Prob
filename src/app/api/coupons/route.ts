import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '../../../lib/couponService';
import { CreateCouponInput, CouponQuery } from '../../../models/Coupon';
import { APIError } from '../../../lib/errors';
import { verifyJWT } from '../../../lib/auth';

const couponService = new CouponService();

/**
 * GET /api/coupons - Search and list coupons
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view coupons (admin or mentor)
    const isAdmin = authResult.user.role === 'admin' || authResult.user.role === 'super_admin';
    const isMentor = authResult.user.role === 'mentor';
    
    if (!isAdmin && !isMentor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view coupons' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: CouponQuery = {
      search: searchParams.get('search') || undefined,
      filters: {
        is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
        discount_type: searchParams.get('discount_type') as any || undefined,
        created_by: isAdmin ? searchParams.get('created_by') || undefined : authResult.user.id,
        valid_only: searchParams.get('valid_only') === 'true'
      },
      sortBy: (searchParams.get('sortBy') as any) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    const result = await couponService.searchCoupons(query);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coupons - Create new coupon
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to create coupons (admin or mentor)
    const isAdmin = authResult.user.role === 'admin' || authResult.user.role === 'super_admin';
    const isMentor = authResult.user.role === 'mentor';
    
    if (!isAdmin && !isMentor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to create coupons' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.code || !body.discount_type || body.discount_value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Code, discount type, and discount value are required' },
        { status: 400 }
      );
    }

    // Prepare coupon data
    const couponData: CreateCouponInput = {
      code: body.code,
      description: body.description,
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      min_amount: body.min_amount || 0,
      max_discount: body.max_discount,
      usage_limit: body.usage_limit,
      valid_from: body.valid_from ? new Date(body.valid_from) : new Date(),
      valid_until: body.valid_until ? new Date(body.valid_until) : undefined,
      is_active: body.is_active !== undefined ? body.is_active : true
    };

    const coupon = await couponService.createCoupon(couponData, authResult.user.id);

    return NextResponse.json({
      success: true,
      data: coupon
    }, { status: 201 });
  } catch (error) {
    console.error('Create coupon error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
