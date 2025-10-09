import { NextRequest, NextResponse } from 'next/server';
import { walletService } from '@/lib/walletService';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's wallet
    const walletResult = await walletService.getWallet(authResult.user.id);
    if (!walletResult.success || !walletResult.walletId) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Get transaction history
    const transactions = await walletService.getTransactionHistory(
      walletResult.walletId,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          limit,
          offset,
          hasMore: transactions.length === limit
        }
      }
    });
  } catch (error) {
    console.error('Wallet transactions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}