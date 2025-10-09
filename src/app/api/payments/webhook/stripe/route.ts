import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    const payload = JSON.parse(body);

    // Process webhook
    const result = await paymentService.handleWebhook('stripe', payload, signature);

    if (!result.success) {
      console.error('Stripe webhook processing failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}