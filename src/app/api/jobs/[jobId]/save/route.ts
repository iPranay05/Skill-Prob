import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyAuth } from '@/lib/auth';

export async function POST(
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

    const savedJob = await JobService.saveJob(authResult.user.id, params.jobId);

    return NextResponse.json({
      success: true,
      data: savedJob,
      message: 'Job saved successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SAVE_JOB_ERROR',
          message: error.message || 'Failed to save job'
        }
      },
      { status: error.status || 500 }
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

    await JobService.unsaveJob(authResult.user.id, params.jobId);

    return NextResponse.json({
      success: true,
      message: 'Job unsaved successfully'
    });
  } catch (error: any) {
    console.error('Error unsaving job:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNSAVE_JOB_ERROR',
          message: error.message || 'Failed to unsave job'
        }
      },
      { status: error.status || 500 }
    );
  }
}