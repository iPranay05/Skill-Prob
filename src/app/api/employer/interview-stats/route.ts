import { NextRequest, NextResponse } from 'next/server';
import { InterviewSchedulingService } from '@/lib/interviewSchedulingService';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Check if user is employer or admin
    if (!['employer', 'admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only employers and admins can view interview statistics'
          }
        },
        { status: 403 }
      );
    }

    const stats = await InterviewSchedulingService.getInterviewStats(authResult.user.id);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching interview stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_INTERVIEW_STATS_ERROR',
          message: error.message || 'Failed to fetch interview statistics'
        }
      },
      { status: error.status || 500 }
    );
  }
}