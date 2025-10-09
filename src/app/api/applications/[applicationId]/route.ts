import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { UpdateJobApplicationSchema } from '@/models/JobPosting';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
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

    const application = await JobService.getJobApplication(params.applicationId);

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPLICATION_NOT_FOUND',
            message: 'Job application not found'
          }
        },
        { status: 404 }
      );
    }

    // Check authorization
    const isOwner = application.applicant_id === authResult.user.id;
    const isEmployer = application.job_posting.posted_by === authResult.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(authResult.user.role);

    if (!isOwner && !isEmployer && !isAdmin) {
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
    console.error('Error fetching application:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_APPLICATION_ERROR',
          message: error.message || 'Failed to fetch application'
        }
      },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
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

    // First get the application to check permissions
    const existingApplication = await JobService.getJobApplication(params.applicationId);
    if (!existingApplication) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPLICATION_NOT_FOUND',
            message: 'Job application not found'
          }
        },
        { status: 404 }
      );
    }

    // Check if user can update this application
    const isEmployer = existingApplication.job_posting.posted_by === authResult.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(authResult.user.role);

    if (!isEmployer && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only employers and admins can update application status'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = UpdateJobApplicationSchema.parse(body);

    const application = await JobService.updateJobApplicationStatus(
      params.applicationId,
      validatedData,
      authResult.user.id
    );

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating application:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_APPLICATION_ERROR',
          message: error.message || 'Failed to update application'
        }
      },
      { status: error.status || 500 }
    );
  }
}