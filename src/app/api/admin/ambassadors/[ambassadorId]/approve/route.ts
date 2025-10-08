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
    const { notes } = body;

    // Approve ambassador
    const ambassador = await AmbassadorService.approveAmbassador(
      ambassadorId,
      authResult.user.userId,
      notes
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
    console.error('Ambassador approval error:', error);
    
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