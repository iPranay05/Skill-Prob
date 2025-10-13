import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { CreateJobApplicationSchema, ApplicationSearchQuery } from '@/models/Job';
import { verifyAuth } from '@/lib/auth';

export async function GET(
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

    // Check if user can view applications for this job
    const canView = authResult.user.id === jobPosting.employer_id || 
                   ['admin', 'super_admin'].includes(authResult.user.role);

    if (!canView) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view applications for your own job postings'
          }
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Build search query from URL parameters
    const query: ApplicationSearchQuery = {
      filters: {
        status: searchParams.get('status') as any || undefined,
        applied_after: searchParams.get('applied_after') ? new Date(searchParams.get('applied_after')!) : undefined,
        applied_before: searchParams.get('applied_before') ? new Date(searchParams.get('applied_before')!) : undefined
      },
      sortBy: searchParams.get('sortBy') as any || 'applied_at',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    };

    // Remove undefined values from filters
    Object.keys(query.filters!).forEach(key => {
      if (query.filters![key as keyof typeof query.filters] === undefined) {
        delete query.filters![key as keyof typeof query.filters];
      }
    });

    const result = await JobService.getApplicationsByJobPosting(jobId, query);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting job applications:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get job applications'
        }
      },
      { status: 500 }
    );
  }
}

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

    // Check if user is a student
    if (authResult.user.role !== 'student') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only students can apply for jobs'
          }
        },
        { status: 403 }
      );
    }

    const { jobId } = await params;

    // Check if job posting exists and is published
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

    if (jobPosting.status !== 'published') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'JOB_NOT_AVAILABLE',
            message: 'This job posting is not available for applications'
          }
        },
        { status: 400 }
      );
    }

    // Check application deadline
    if (jobPosting.application_deadline && new Date() > jobPosting.application_deadline) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DEADLINE_PASSED',
            message: 'Application deadline has passed'
          }
        },
        { status: 400 }
      );
    }

    // Check if max applications reached
    if (jobPosting.max_applications && jobPosting.current_applications >= jobPosting.max_applications) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MAX_APPLICATIONS_REACHED',
            message: 'Maximum number of applications reached for this job'
          }
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = CreateJobApplicationSchema.safeParse({
      ...body,
      job_posting_id: jobId,
      applicant_id: authResult.user.id
    });

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

    const application = await JobService.createJobApplication(validationResult.data);

    return NextResponse.json({
      success: true,
      data: application
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating job application:', error);
    
    // Handle duplicate application error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_APPLIED',
            message: 'You have already applied for this job'
          }
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'APPLICATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create job application'
        }
      },
      { status: 500 }
    );
  }
}