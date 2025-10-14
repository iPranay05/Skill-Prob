import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../../lib/enrollmentService';
import { ValidateCouponInput } from '../../../../models/Coupon';
import { APIError } from '../../../../lib/errors';
import { verifyJWT } from '../../../../lib/auth';

const enrollmentService = new EnrollmentService();

/**
 * POST /api/coupons/validate - Validate coupon for enrollment
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

    const body = await request.json();
    
    // Validate required fields
    if (!body.code || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Coupon code and amount are required' },
        { status: 400 }
      );
    }

    // Prepare validation data
    const validationData: ValidateCouponInput = {
      code: body.code,
      course_id: body.course_id,
      user_id: authResult.user.userId,
      amount: body.amount
    };

    const result = await enrollmentService.validateCoupon(validationData);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    
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
