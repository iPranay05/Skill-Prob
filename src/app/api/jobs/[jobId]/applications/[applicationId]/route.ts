import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { UpdateJobApplicationSchema, ApplicationStatus } from '@/models/Job';
import { verifyAuth } from '@/lib/auth';

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

    const application = await JobService.getJobApplicationById(params.applicationId);
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
    const jobPosting = await JobService.getJobPostingById(params.jobId);
    const canView = authResult.user.id === application.applicant_id || 
                   authResult.user.id === jobPosting?.employer_id ||
                   ['admin', 'super_admin'].includes(authResult.user.role);

    if (!canView) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own applications or applications for your job postings'
          }
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error getting job application:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get job application'
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const application = await JobService.getJobApplicationById(params.applicationId);
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

    // Check permissions
    const isApplicant = authResult.user.id === application.applicant_id;
    const isEmployer = authResult.user.id === jobPosting.employer_id;
    const isAdmin = ['admin', 'super_admin'].includes(authResult.user.role);

    if (!isApplicant && !isEmployer && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own applications or applications for your job postings'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = UpdateJobApplicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid application data',
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    // Applicants can only withdraw their applications
    if (isApplicant && !isEmployer && !isAdmin) {
      if (validationResult.data.status && validationResult.data.status !== ApplicationStatus.WITHDRAWN) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Applicants can only withdraw their applications'
            }
          },
          { status: 403 }
        );
      }
    }

    // Add status_updated_by if status is being changed
    const updates = { ...validationResult.data };
    if (updates.status) {
      updates.status_updated_by = authResult.user.id;
    }

    const updatedApplication = await JobService.updateJobApplication(params.applicationId, updates);

    return NextResponse.json({
      success: true,
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating job application:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update job application'
        }
      },
      { status: 500 }
    );
  }
}