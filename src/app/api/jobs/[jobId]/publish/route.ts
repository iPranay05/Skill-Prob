import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
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

    const { jobId } = await params;

    // Get the job posting to check ownership
    const existingJob = await JobService.getJobPostingById(jobId);
    if (!existingJob) {
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

    // Check if user can publish this job posting
    const canPublish = authResult.user.id === existingJob.employer_id || 
                      ['admin', 'super_admin'].includes(authResult.user.role);

    if (!canPublish) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only publish your own job postings'
          }
        },
        { status: 403 }
      );
    }

    // Check if job is already published
    if (existingJob.status === 'published') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_PUBLISHED',
            message: 'Job posting is already published'
          }
        },
        { status: 400 }
      );
    }

    const publishedJob = await JobService.publishJobPosting(jobId);

    return NextResponse.json({
      success: true,
      data: publishedJob,
      message: 'Job posting published successfully'
    });
  } catch (error) {
    console.error('Error publishing job posting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PUBLISH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to publish job posting'
        }
      },
      { status: 500 }
    );
  }
}