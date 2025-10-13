import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/adminService';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get pending payouts
    const payouts = await adminService.getPendingPayouts();

    return NextResponse.json({
      success: true,
      data: payouts
    });

  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pending payouts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { payoutId, decision, transactionId, notes } = body;

    if (!payoutId || !decision) {
      return NextResponse.json(
        { success: false, error: 'Payout ID and decision are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'processed'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'Decision must be approved, rejected, or processed' },
        { status: 400 }
      );
    }

    if (decision === 'processed' && !transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required for processed payouts' },
        { status: 400 }
      );
    }

    await adminService.processPayout(
      payoutId,
      decision,
      authResult.user.userId,
      transactionId,
      notes
    );

    return NextResponse.json({
      success: true,
      message: `Payout ${decision} successfully`
    });

  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process payout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}