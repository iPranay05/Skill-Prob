import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { UpdateJobApplicationSchema, ApplicationStatus } from '@/models/Job';
import { verifyAuth } from '@/lib/auth';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; applicationId: string }> }
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

    const { jobId, applicationId } = await params;
    const application = await JobService.getJobApplicationById(applicationId);
    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Application not found'
          }
        },
        { status: 404 }
      );
    }

    // Check if user can view this application
    const jobPosting = await JobService.getJobPostingById(jobId);
    const canView = authResult.user.userId === application.applicant_id || 
                   authResult.user.userId === jobPosting?.employer_id ||
                   ['admin', 'super_admin'].includes(authResult.user.role);

    if (!canView) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this application'
          }
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application
    });
  } catch (error: any) {
    console.error('Error fetching job application:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_APPLICATION_ERROR',
          message: error.message || 'Failed to fetch job application'
        }
      },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; applicationId: string }> }
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

    const { jobId, applicationId } = await params;
    const application = await JobService.getJobApplicationById(applicationId);
    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Application not found'
          }
        },
        { status: 404 }
      );
    }

    // Check if user can update this application
    const jobPosting = await JobService.getJobPostingById(jobId);
    const canUpdate = authResult.user.userId === jobPosting?.employer_id ||
                     ['admin', 'super_admin'].includes(authResult.user.role);

    if (!canUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this application'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    try {
      const validatedData = UpdateJobApplicationSchema.parse(body);
      const updatedApplication = await JobService.updateJobApplication(
        applicationId,
        validatedData
      );

      return NextResponse.json({
        success: true,
        data: updatedApplication
      });
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: validationError.issues
            }
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error: any) {
    console.error('Error updating job application:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_APPLICATION_ERROR',
          message: error.message || 'Failed to update job application'
        }
      },
      { status: error.status || 500 }
    );
  }
}