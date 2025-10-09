import { NextRequest, NextResponse } from 'next/server';
import { InterviewSchedulingService } from '@/lib/interviewSchedulingService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const CancelInterviewSchema = z.object({
  reason: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
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
            message: 'Only employers and admins can cancel interviews'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = CancelInterviewSchema.parse(body);

    await InterviewSchedulingService.cancelInterview(
      params.applicationId,
      validatedData.reason,
      authResult.user.id
    );

    return NextResponse.json({
      success: true,
      message: 'Interview cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling interview:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CANCEL_INTERVIEW_ERROR',
          message: error.message || 'Failed to cancel interview'
        }
      },
      { status: error.status || 500 }
    );
  }
}