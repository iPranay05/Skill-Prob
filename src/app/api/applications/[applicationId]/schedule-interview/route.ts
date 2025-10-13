import { NextRequest, NextResponse } from 'next/server';
import { InterviewSchedulingService, ScheduleInterviewRequest } from '@/lib/interviewSchedulingService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const ScheduleInterviewSchema = z.object({
  interview_date: z.string().datetime(),
  duration_minutes: z.number().min(15).max(180).default(60),
  interview_type: z.enum(['phone', 'video', 'in_person']).default('video'),
  location: z.string().optional(),
  meeting_link: z.string().url().optional(),
  interviewer_id: z.string().uuid().optional(),
  notes: z.string().optional()
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
            message: 'Only employers and admins can schedule interviews'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = ScheduleInterviewSchema.parse(body);

    const { applicationId } = await params;
    const scheduleRequest: ScheduleInterviewRequest = {
      application_id: applicationId,
      interview_date: new Date(validatedData.interview_date),
      duration_minutes: validatedData.duration_minutes,
      interview_type: validatedData.interview_type,
      location: validatedData.location,
      meeting_link: validatedData.meeting_link,
      interviewer_id: validatedData.interviewer_id,
      notes: validatedData.notes
    };

    await InterviewSchedulingService.scheduleInterview(scheduleRequest, authResult.user.userId);

    return NextResponse.json({
      success: true,
      message: 'Interview scheduled successfully'
    });
  } catch (error: any) {
    console.error('Error scheduling interview:', error);
    
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
          code: 'SCHEDULE_INTERVIEW_ERROR',
          message: error.message || 'Failed to schedule interview'
        }
      },
      { status: error.status || 500 }
    );
  }
}