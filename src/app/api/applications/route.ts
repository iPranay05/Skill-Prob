import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { ApplicationSearchQuery } from '@/models/JobPosting';
import { verifyAuth } from '@/lib/auth';

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

    const { searchParams } = new URL(request.url);
    
    // Build search query
    const searchQuery: ApplicationSearchQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as any) || 'applied_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      filters: {}
    };

    // For students, only show their applications
    if (authResult.user.role === 'student') {
      searchQuery.filters!.applicant_id = authResult.user.id;
    }

    // For employers, only show applications for their jobs
    if (authResult.user.role === 'employer') {
      // This will be handled in the service layer by joining with job_postings
      // and filtering by posted_by = user.id
    }

    // Parse filters
    const status = searchParams.get('status');
    if (status) {
      searchQuery.filters!.status = status.split(',') as any[];
    }

    const jobPostingId = searchParams.get('job_posting_id');
    if (jobPostingId) {
      searchQuery.filters!.job_posting_id = jobPostingId;
    }

    const appliedWithinDays = searchParams.get('applied_within_days');
    if (appliedWithinDays) {
      searchQuery.filters!.applied_within_days = parseInt(appliedWithinDays);
    }

    let result;
    if (authResult.user.role === 'student') {
      // Get student's applications
      const applications = await JobService.getStudentApplications(authResult.user.id);
      result = {
        applications,
        total: applications.length,
        page: 1,
        totalPages: 1
      };
    } else if (authResult.user.role === 'employer') {
      // Get employer's applications
      const applications = await JobService.getEmployerApplications(
        authResult.user.id,
        jobPostingId || undefined
      );
      result = {
        applications,
        total: applications.length,
        page: 1,
        totalPages: 1
      };
    } else {
      // Admin can see all applications
      result = await JobService.getJobApplications(searchQuery);
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_APPLICATIONS_ERROR',
          message: error.message || 'Failed to fetch applications'
        }
      },
      { status: error.status || 500 }
    );
  }
}