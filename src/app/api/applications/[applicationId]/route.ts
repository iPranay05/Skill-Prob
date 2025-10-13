import { NextRequest, NextResponse } from 'next/server';
import { UpdateJobApplicationSchema } from '@/models/JobPosting';
import { verifyAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
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

    const { applicationId } = await params;
    // Get application with job posting details
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        job_postings!inner (
          id,
          posted_by,
          title,
          company_name
        )
      `)
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
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
    const isOwner = application.applicant_id === authResult.user.userId;
    const isEmployer = application.job_postings.posted_by === authResult.user.userId;
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
  { params }: { params: Promise<{ applicationId: string }> }
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
    const { applicationId } = await params;
    const { data: existingApplication, error: fetchError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        job_postings!inner (
          id,
          posted_by,
          title,
          company_name
        )
      `)
      .eq('id', applicationId)
      .single();

    if (fetchError || !existingApplication) {
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
    const isEmployer = existingApplication.job_postings.posted_by === authResult.user.userId;
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

    // Update the application
    const { data: application, error: updateError } = await supabaseAdmin
      .from('job_applications')
      .update({
        ...validatedData,
        status_updated_by: authResult.user.userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError || !application) {
      return NextResponse.json(
        { success: false, error: 'Failed to update application' },
        { status: 500 }
      );
    }

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