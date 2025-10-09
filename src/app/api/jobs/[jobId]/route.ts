import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { UpdateJobPostingSchema } from '@/models/Job';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobPosting = await JobService.getJobPostingById(params.jobId);

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

    return NextResponse.json({
      success: true,
      data: jobPosting
    });
  } catch (error) {
    console.error('Error getting job posting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get job posting'
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
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

    // Get the job posting to check ownership
    const existingJob = await JobService.getJobPostingById(params.jobId);
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

    // Check if user can update this job posting
    const canUpdate = authResult.user.id === existingJob.employer_id || 
                     ['admin', 'super_admin'].includes(authResult.user.role);

    if (!canUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own job postings'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = UpdateJobPostingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid job posting data',
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    const updatedJob = await JobService.updateJobPosting(params.jobId, validationResult.data);

    return NextResponse.json({
      success: true,
      data: updatedJob
    });
  } catch (error) {
    console.error('Error updating job posting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update job posting'
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
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

    // Get the job posting to check ownership
    const existingJob = await JobService.getJobPostingById(params.jobId);
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

    // Check if user can delete this job posting
    const canDelete = authResult.user.id === existingJob.employer_id || 
                     ['admin', 'super_admin'].includes(authResult.user.role);

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own job postings'
          }
        },
        { status: 403 }
      );
    }

    await JobService.deleteJobPosting(params.jobId);

    return NextResponse.json({
      success: true,
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job posting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete job posting'
        }
      },
      { status: 500 }
    );
  }
}