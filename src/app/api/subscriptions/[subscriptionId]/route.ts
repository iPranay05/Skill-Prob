import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscriptionService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const UpdateSubscriptionSchema = z.object({
  action: z.enum(['cancel', 'pause', 'resume']),
  reason: z.string().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
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

    const { subscriptionId  } = await params;

    // Get subscription details
    const subscription = await subscriptionService.getSubscriptionDetails(subscriptionId);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if user owns this subscription
    if (subscription.student_id !== authResult.user.id && !['admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Subscription details API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
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

    const { subscriptionId  } = await params;

    // Parse request body
    const body = await request.json();
    const validatedData = UpdateSubscriptionSchema.parse(body);

    let result;
    switch (validatedData.action) {
      case 'cancel':
        result = await subscriptionService.cancelSubscription(subscriptionId, validatedData.reason);
        break;
      case 'pause':
        result = await subscriptionService.pauseSubscription(subscriptionId, validatedData.reason);
        break;
      case 'resume':
        result = await subscriptionService.resumeSubscription(subscriptionId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { subscriptionId: result.subscriptionId }
    });
  } catch (error) {
    console.error('Subscription update API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}