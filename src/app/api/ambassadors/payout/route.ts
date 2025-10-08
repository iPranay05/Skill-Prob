import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../lib/ambassadorService';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { UserRole } from '../../../../types/user';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { pointsToRedeem, conversionRate = 1 } = body;

    // Validate input
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid points amount' },
        { status: 400 }
      );
    }

    if (pointsToRedeem < 100) {
      return NextResponse.json(
        { success: false, error: 'Minimum payout is 100 points' },
        { status: 400 }
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

    // Check if ambassador has KYC verified
    if (!ambassador.payoutDetails?.verified) {
      return NextResponse.json(
        { success: false, error: 'KYC verification required for payout' },
        { status: 400 }
      );
    }

    // Request payout
    const payoutRequest = await AmbassadorService.requestPayout(
      ambassador.id!,
      pointsToRedeem,
      conversionRate
    );

    return NextResponse.json({
      success: true,
      data: {
        id: payoutRequest.id,
        amount: payoutRequest.amount,
        pointsRedeemed: payoutRequest.pointsRedeemed,
        status: payoutRequest.status,
        requestedAt: payoutRequest.requestedAt
      }
    });

  } catch (error) {
    console.error('Payout request error:', error);
    
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get payout requests
    const payoutRequests = await AmbassadorService.getPayoutRequests(
      ambassador.id!,
      undefined,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: payoutRequests.map(request => ({
        id: request.id,
        amount: request.amount,
        pointsRedeemed: request.pointsRedeemed,
        status: request.status,
        requestedAt: request.requestedAt,
        processedAt: request.processedAt,
        transactionId: request.transactionId,
        adminNotes: request.adminNotes,
        rejectionReason: request.rejectionReason
      }))
    });

  } catch (error) {
    console.error('Payout requests fetch error:', error);
    
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
