import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscriptionService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const CreateSubscriptionSchema = z.object({
  courseId: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'yearly']),
  amount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  autoRenew: z.boolean().optional().default(true)
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = CreateSubscriptionSchema.parse(body);

    // Create subscription
    const result = await subscriptionService.createSubscription({
      ...validatedData,
      studentId: authResult.user.userId
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        paymentId: result.paymentId
      }
    });
  } catch (error) {
    console.error('Subscription creation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}