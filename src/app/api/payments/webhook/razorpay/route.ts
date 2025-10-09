import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-razorpay-signature');
    
    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const payload = await request.json();

    // Process webhook
    const result = await paymentService.handleWebhook('razorpay', payload, signature);

    if (!result.success) {
      console.error('Razorpay webhook processing failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}