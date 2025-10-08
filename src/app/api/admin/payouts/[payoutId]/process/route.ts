import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../../../lib/ambassadorService';
import { verifyToken } from '../../../../../../lib/auth';
import { AppError } from '../../../../../../lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
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

    const { payoutId } = params;
    const body = await request.json();
    const { approved, transactionId, notes } = body;

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Approved status (boolean) is required' },
        { status: 400 }
      );
    }

    if (approved && !transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required for approved payouts' },
        { status: 400 }
      );
    }

    if (!approved && !notes) {
      return NextResponse.json(
        { success: false, error: 'Notes are required for rejected payouts' },
        { status: 400 }
      );
    }

    // Process payout request
    const payoutRequest = await AmbassadorService.processPayoutRequest(
      payoutId,
      authResult.user.userId,
      approved,
      transactionId,
      notes
    );

    return NextResponse.json({
      success: true,
      data: {
        id: payoutRequest.id,
        status: payoutRequest.status,
        processedAt: payoutRequest.processedAt,
        processedBy: payoutRequest.processedBy,
        transactionId: payoutRequest.transactionId,
        adminNotes: payoutRequest.adminNotes,
        rejectionReason: payoutRequest.rejectionReason
      }
    });

  } catch (error) {
    console.error('Payout processing error:', error);
    
    if (error instanceof AppError) {
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