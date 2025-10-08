import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../lib/ambassadorService';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { PayoutStatus } from '../../../../models/Ambassador';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PayoutStatus;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get payout requests
    const payoutRequests = await AmbassadorService.getPayoutRequests(
      undefined, // all ambassadors
      status,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: payoutRequests.map(request => ({
        id: request.id,
        ambassadorId: request.ambassadorId,
        ambassadorCode: request.ambassadors?.referralCode,
        ambassadorEmail: request.ambassadors?.users?.email,
        ambassadorProfile: request.ambassadors?.users?.profile,
        amount: request.amount,
        pointsRedeemed: request.pointsRedeemed,
        status: request.status,
        requestedAt: request.requestedAt,
        processedAt: request.processedAt,
        processedBy: request.processedBy,
        transactionId: request.transactionId,
        adminNotes: request.adminNotes,
        rejectionReason: request.rejectionReason
      }))
    });

  } catch (error) {
    console.error('Admin payouts fetch error:', error);
    
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
