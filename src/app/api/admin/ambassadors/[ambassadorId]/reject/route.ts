import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../../../lib/ambassadorService';
import { verifyToken } from '../../../../../../lib/auth';
import { AppError } from '../../../../../../lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { ambassadorId: string } }
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

    const { ambassadorId } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Reject ambassador
    const ambassador = await AmbassadorService.rejectAmbassador(
      ambassadorId,
      authResult.user.userId,
      reason
    );

    return NextResponse.json({
      success: true,
      data: {
        id: ambassador.id,
        status: ambassador.status,
        reviewedAt: ambassador.reviewed_at,
        reviewedBy: ambassador.reviewed_by,
        reviewNotes: ambassador.review_notes
      }
    });

  } catch (error) {
    console.error('Ambassador rejection error:', error);
    
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