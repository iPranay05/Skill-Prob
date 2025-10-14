import { NextRequest, NextResponse } from 'next/server';
import { walletService } from '@/lib/walletService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const PayoutRequestSchema = z.object({
  amount: z.number().positive(),
  pointsToRedeem: z.number().positive(),
  bankDetails: z.object({
    accountNumber: z.string().min(1),
    ifscCode: z.string().min(1),
    accountHolderName: z.string().min(1),
    bankName: z.string().min(1)
  }).optional()
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

    // Check if user is an ambassador
    if (authResult.user.role !== 'ambassador') {
      return NextResponse.json(
        { success: false, error: 'Only ambassadors can request payouts' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = PayoutRequestSchema.parse(body);

    // Get ambassador ID from database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ambassador } = await supabase
      .from('ambassadors')
      .select('id')
      .eq('user_id', authResult.user.userId)
      .single();

    if (!ambassador) {
      return NextResponse.json(
        { success: false, error: 'Ambassador profile not found' },
        { status: 404 }
      );
    }

    // Request payout
    const result = await walletService.requestPayout({
      ambassadorId: ambassador.id,
      amount: validatedData.amount,
      pointsToRedeem: validatedData.pointsToRedeem,
      bankDetails: validatedData.bankDetails
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payout request submitted successfully'
    });
  } catch (error) {
    console.error('Payout request API error:', error);
    
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