import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const SaveJobSchema = z.object({
  jobPostingId: z.string().uuid()
});

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
  } catch (error) {
    console.error('Error getting saved jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get saved jobs'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate input
    const validationResult = SaveJobSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid save job data',
            details: validationResult.error.issues
          }
        },
        { status: 400 }
      );
    }

    const { jobPostingId } = validationResult.data;

    // Check if job posting exists
    const jobPosting = await JobService.getJobPostingById(jobPostingId);
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

    await JobService.saveJob(authResult.user.userId, jobPostingId);

    return NextResponse.json({
      success: true,
      message: 'Job saved successfully'
    });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SAVE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to save job'
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const jobPostingId = searchParams.get('jobPostingId');

    if (!jobPostingId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Job posting ID is required'
          }
        },
        { status: 400 }
      );
    }

    await JobService.unsaveJob(authResult.user.userId, jobPostingId);

    return NextResponse.json({
      success: true,
      message: 'Job unsaved successfully'
    });
  } catch (error) {
    console.error('Error unsaving job:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNSAVE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to unsave job'
        }
      },
      { status: 500 }
    );
  }
}