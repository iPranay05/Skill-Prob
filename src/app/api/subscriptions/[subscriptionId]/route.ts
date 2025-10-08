import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../../lib/enrollmentService';
import { SubscriptionStatus } from '../../../../models/Enrollment';
import { APIError } from '../../../../lib/errors';
import { verifyJWT } from '../../../../lib/auth';

const enrollmentService = new EnrollmentService();

/**
 * PATCH /api/subscriptions/[subscriptionId] - Update subscription status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { subscriptionId: string } }
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

    const subscription = await enrollmentService.updateSubscriptionStatus(
      params.subscriptionId,
      body.status as SubscriptionStatus,
      body.cancellation_reason
    );

    return NextResponse.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    
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