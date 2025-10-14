import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { JobStatus } from '@/models/JobPosting';
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
            message: 'Only employers and admins can access this endpoint'
          }
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as JobStatus | undefined;

    const jobs = await JobService.getJobPostingsByEmployer(authResult.user.userId, status);

    return NextResponse.json({
      success: true,
      data: jobs
    });
  } catch (error: any) {
    console.error('Error fetching employer jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_EMPLOYER_JOBS_ERROR',
          message: error.message || 'Failed to fetch employer jobs'
        }
      },
      { status: error.status || 500 }
    );
  }
}