import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '../../../../lib/couponService';
import { UpdateCouponInput } from '../../../../models/Coupon';
import { APIError } from '../../../../lib/errors';
import { verifyJWT } from '../../../../lib/auth';

const couponService = new CouponService();

/**
 * GET /api/coupons/[couponId] - Get coupon by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view coupons
    const isAdmin = authResult.user.role === 'admin' || authResult.user.role === 'super_admin';
    const isMentor = authResult.user.role === 'mentor';
    
    if (!isAdmin && !isMentor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view coupons' },
        { status: 403 }
      );
    }

    const { couponId } = await params;
    const coupon = await couponService.getCouponById(couponId);
    
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Non-admin users can only see their own coupons
    if (!isAdmin && coupon.created_by !== authResult.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view this coupon' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Get coupon error:', error);
    
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
 * PATCH /api/coupons/[couponId] - Update coupon
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Prepare update data
    const updateData: UpdateCouponInput = {};
    
    if (body.code !== undefined) updateData.code = body.code;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.discount_type !== undefined) updateData.discount_type = body.discount_type;
    if (body.discount_value !== undefined) updateData.discount_value = body.discount_value;
    if (body.min_amount !== undefined) updateData.min_amount = body.min_amount;
    if (body.max_discount !== undefined) updateData.max_discount = body.max_discount;
    if (body.usage_limit !== undefined) updateData.usage_limit = body.usage_limit;
    if (body.valid_from !== undefined) updateData.valid_from = new Date(body.valid_from);
    if (body.valid_until !== undefined) updateData.valid_until = body.valid_until ? new Date(body.valid_until) : undefined;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { couponId } = await params;
    const coupon = await couponService.updateCoupon(couponId, updateData, authResult.user.userId);

    return NextResponse.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    
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
 * DELETE /api/coupons/[couponId] - Delete coupon
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { couponId } = await params;
    await couponService.deleteCoupon(couponId, authResult.user.userId);

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    
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