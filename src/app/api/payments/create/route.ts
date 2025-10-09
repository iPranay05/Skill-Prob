import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const CreatePaymentSchema = z.object({
  gateway: z.enum(['razorpay', 'stripe', 'wallet']),
  amount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  description: z.string().min(1),
  courseId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional()
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
    const validatedData = CreatePaymentSchema.parse(body);

    // Create payment
    const result = await paymentService.createPayment({
      ...validatedData,
      studentId: authResult.user.id
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
        paymentId: result.paymentId,
        orderId: result.orderId,
        paymentLink: result.paymentLink,
        gatewayResponse: result.gatewayResponse
      }
    });
  } catch (error) {
    console.error('Payment creation API error:', error);
    
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