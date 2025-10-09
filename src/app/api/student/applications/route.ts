import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
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

    // Check if user is student
    if (authResult.user.role !== 'student') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only students can access their applications'
          }
        },
        { status: 403 }
      );
    }

    const applications = await JobService.getApplicationsByApplicant(authResult.user.id);

    return NextResponse.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error getting student applications:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get student applications'
        }
      },
      { status: 500 }
    );
  }
}