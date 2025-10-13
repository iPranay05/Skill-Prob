import { NextRequest, NextResponse } from 'next/server';
import { InterviewSchedulingService } from '@/lib/interviewSchedulingService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const RescheduleInterviewSchema = z.object({
  new_interview_date: z.string().datetime(),
  reason: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
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
            message: 'Only employers and admins can reschedule interviews'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = RescheduleInterviewSchema.parse(body);

    const { applicationId } = await params;
    await InterviewSchedulingService.rescheduleInterview(
      applicationId,
      new Date(validatedData.new_interview_date),
      validatedData.reason,
      authResult.user.userId
    );

    return NextResponse.json({
      success: true,
      message: 'Interview rescheduled successfully'
    });
  } catch (error: any) {
    console.error('Error rescheduling interview:', error);
    
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
          code: 'RESCHEDULE_INTERVIEW_ERROR',
          message: error.message || 'Failed to reschedule interview'
        }
      },
      { status: error.status || 500 }
    );
  }
}