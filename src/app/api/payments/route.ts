import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../lib/enrollmentService';
import { CreatePaymentInput } from '../../../models/Enrollment';
import { APIError } from '../../../lib/errors';
import { verifyJWT } from '../../../lib/auth';

const enrollmentService = new EnrollmentService();

/**
 * POST /api/payments - Create payment record
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
    if (!body.amount || !body.gateway) {
      return NextResponse.json(
        { success: false, error: 'Amount and gateway are required' },
        { status: 400 }
      );
    }

    // Prepare payment data
    const paymentData: CreatePaymentInput = {
      enrollment_id: body.enrollment_id,
      subscription_id: body.subscription_id,
      student_id: authResult.user.id,
      amount: body.amount,
      currency: body.currency || 'INR',
      gateway: body.gateway,
      gateway_payment_id: body.gateway_payment_id,
      gateway_order_id: body.gateway_order_id,
      payment_method: body.payment_method,
      payment_method_details: body.payment_method_details,
      coupon_code: body.coupon_code,
      discount_amount: body.discount_amount || 0
    };

    const payment = await enrollmentService.createPayment(paymentData);

    return NextResponse.json({
      success: true,
      data: payment
    }, { status: 201 });
  } catch (error) {
    console.error('Create payment error:', error);
    
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
