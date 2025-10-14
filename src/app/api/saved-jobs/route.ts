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

    const savedJobs = await JobService.getSavedJobs(authResult.user.userId);

    return NextResponse.json({
      success: true,
      data: savedJobs
    });
  } catch (error: any) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_SAVED_JOBS_ERROR',
          message: error.message || 'Failed to fetch saved jobs'
        }
      },
      { status: error.status || 500 }
    );
  }
}