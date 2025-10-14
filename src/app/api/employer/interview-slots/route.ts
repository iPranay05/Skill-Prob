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
            message: 'Only employers and admins can view interview slots'
          }
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'start_date and end_date parameters are required'
          }
        },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format'
          }
        },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'start_date must be before end_date'
          }
        },
        { status: 400 }
      );
    }

    const slots = await InterviewSchedulingService.getAvailableSlots(
      authResult.user.userId,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      data: slots
    });
  } catch (error: any) {
    console.error('Error fetching interview slots:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_SLOTS_ERROR',
          message: error.message || 'Failed to fetch interview slots'
        }
      },
      { status: error.status || 500 }
    );
  }
}