import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { UpdateJobPostingSchema } from '@/models/Job';
import { verifyAuth } from '@/lib/auth';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
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

    return NextResponse.json({
      success: true,
      data: jobPosting
    });
  } catch (error: any) {
    console.error('Error fetching job posting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_JOB_ERROR',
          message: error.message || 'Failed to fetch job posting'
        }
      },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
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

    // Check if user can update this job posting
    const canUpdate = authResult.user.userId === jobPosting.employer_id ||
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

    try {
      const validatedData = UpdateJobPostingSchema.parse(body);
      const updatedJobPosting = await JobService.updateJobPosting(jobId, validatedData);

      return NextResponse.json({
        success: true,
        data: updatedJobPosting
      });
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid job posting data',
              details: validationError.issues
            }
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error: any) {
    console.error('Error updating job posting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_JOB_ERROR',
          message: error.message || 'Failed to update job posting'
        }
      },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
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

    // Check if user can delete this job posting
    const canDelete = authResult.user.userId === jobPosting.employer_id ||
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

    await JobService.deleteJobPosting(jobId);

    return NextResponse.json({
      success: true,
      message: 'Job posting deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting job posting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_JOB_ERROR',
          message: error.message || 'Failed to delete job posting'
        }
      },
      { status: error.status || 500 }
    );
  }
}