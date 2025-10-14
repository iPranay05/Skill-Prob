import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
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

    // Get the job posting to check ownership
    const jobPosting = await JobService.getJobPostingById(jobId);
    if (!jobPosting) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Job posting not found'
          }
        },
        { status: 404 }
      );
    }

    // Check if user can view stats for this job
    const canView = authResult.user.userId === jobPosting.employer_id || 
                   ['admin', 'super_admin'].includes(authResult.user.role);

    if (!canView) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view stats for your own job postings'
          }
        },
        { status: 403 }
      );
    }

    const stats = await JobService.getJobPostingStats(jobId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting job stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get job statistics'
        }
      },
      { status: 500 }
    );
  }
}