import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../lib/ambassadorService';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { UserRole } from '../../../../types/user';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an ambassador
    if (authResult.user.role !== UserRole.AMBASSADOR) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Ambassador role required.' },
        { status: 403 }
      );
    }

    // Get ambassador record
    const ambassador = await AmbassadorService.getAmbassadorByUserId(authResult.user.userId);
    if (!ambassador) {
      return NextResponse.json(
        { success: false, error: 'Ambassador profile not found' },
        { status: 404 }
      );
    }

    // Get analytics data
    const analytics = await AmbassadorService.getAmbassadorAnalytics(ambassador.id!);

    // Get wallet information
    const wallet = await AmbassadorService.getWalletByUserId(authResult.user.userId);

    // Get recent referrals
    const referrals = await AmbassadorService.getReferralsByAmbassador(ambassador.id!, 10, 0);

    // Get recent transactions
    const transactions = wallet ? 
      await AmbassadorService.getWalletTransactions(wallet.id!, 10, 0) : [];

    // Get pending payout requests
    const payoutRequests = await AmbassadorService.getPayoutRequests(ambassador.id!, undefined, 5, 0);

    return NextResponse.json({
      success: true,
      data: {
        ambassador: {
          id: ambassador.id,
          referralCode: ambassador.referralCode,
          status: ambassador.status,
          performance: ambassador.performance,
          createdAt: ambassador.createdAt
        },
        analytics: analytics.analytics,
        wallet: wallet ? {
          id: wallet.id,
          balance: wallet.balance,
          totalEarned: wallet.totalEarned,
          totalWithdrawn: wallet.totalWithdrawn
        } : null,
        recentReferrals: referrals.map(referral => ({
          id: referral.id,
          studentEmail: referral.users?.email,
          registrationDate: referral.registrationDate,
          status: referral.status,
          conversionEvents: referral.conversionEvents
        })),
        recentTransactions: transactions.map(transaction => ({
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          points: transaction.points,
          description: transaction.description,
          createdAt: transaction.createdAt
        })),
        payoutRequests: payoutRequests.map(request => ({
          id: request.id,
          amount: request.amount,
          pointsRedeemed: request.pointsRedeemed,
          status: request.status,
          requestedAt: request.requestedAt,
          processedAt: request.processedAt
        }))
      }
    });

  } catch (error) {
    console.error('Ambassador dashboard error:', error);
    
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
