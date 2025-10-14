import { NextRequest, NextResponse } from 'next/server';
import { walletService } from '@/lib/walletService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const ConvertPointsSchema = z.object({
  points: z.number().positive(),
  conversionRate: z.number().positive().optional().default(0.1)
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
    const validatedData = ConvertPointsSchema.parse(body);

    // Get user's wallet
    const walletResult = await walletService.getWallet(authResult.user.userId);
    if (!walletResult.success || !walletResult.walletId) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Convert points to credits
    const result = await walletService.convertPointsToCredits(
      walletResult.walletId,
      validatedData.points,
      validatedData.conversionRate
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: result.transactionId,
        newBalance: result.balance
      }
    });
  } catch (error) {
    console.error('Points conversion API error:', error);
    
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