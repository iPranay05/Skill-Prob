import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../../lib/enrollmentService';
import { PaymentStatus } from '../../../../models/Enrollment';
import { APIError } from '../../../../lib/errors';
import { verifyJWT } from '../../../../lib/auth';

const enrollmentService = new EnrollmentService();

/**
 * PATCH /api/payments/[paymentId] - Update payment status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
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
    
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const payment = await enrollmentService.updatePaymentStatus(
      params.paymentId,
      body.status as PaymentStatus,
      body.gateway_payment_id,
      body.failure_reason
    );

    return NextResponse.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Update payment error:', error);
    
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