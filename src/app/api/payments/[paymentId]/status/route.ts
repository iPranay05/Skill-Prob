import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentId } = await params;

    // Get payment status
    const payment = await paymentService.getPaymentStatus(paymentId);

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if user owns this payment
    if (payment.student_id !== authResult.user.userId && !['admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Payment status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}