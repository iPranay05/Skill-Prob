import { NextRequest, NextResponse } from 'next/server';
import { ApplicationSearchQuery } from '@/models/JobPosting';
import { verifyAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';

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
      searchQuery.filters!.applicant_id = authResult.user.userId;
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
      const { data: applications, error: studentError } = await supabaseAdmin
        .from('job_applications')
        .select(`
          *,
          job_postings (
            id,
            title,
            company,
            location,
            salary_min,
            salary_max,
            currency
          )
        `)
        .eq('applicant_id', authResult.user.userId)
        .order('created_at', { ascending: false });

      if (studentError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch applications' },
          { status: 500 }
        );
      }

      result = {
        applications: applications || [],
        total: applications?.length || 0,
        page: 1,
        totalPages: 1
      };
    } else if (authResult.user.role === 'employer') {
      // Get employer's applications
      let query = supabaseAdmin
        .from('job_applications')
        .select(`
          *,
          job_postings!inner (
            id,
            title,
            company,
            location,
            salary_min,
            salary_max,
            currency,
            employer_id
          )
        `)
        .eq('job_postings.employer_id', authResult.user.userId)
        .order('created_at', { ascending: false });

      if (jobPostingId) {
        query = query.eq('job_posting_id', jobPostingId);
      }

      const { data: applications, error: employerError } = await query;

      if (employerError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch applications' },
          { status: 500 }
        );
      }

      result = {
        applications: applications || [],
        total: applications?.length || 0,
        page: 1,
        totalPages: 1
      };
    } else {
      // Admin can see all applications
      let query = supabaseAdmin
        .from('job_applications')
        .select(`
          *,
          job_postings (
            id,
            title,
            company,
            location,
            salary_min,
            salary_max,
            currency
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (searchQuery.filters?.status) {
        query = query.eq('status', searchQuery.filters.status);
      }
      if (searchQuery.filters?.job_posting_id) {
        query = query.eq('job_posting_id', searchQuery.filters.job_posting_id);
      }

      // Apply pagination
      const page = searchQuery.page || 1;
      const limit = searchQuery.limit || 20;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      const { data: applications, error: adminError, count } = await query;

      if (adminError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch applications' },
          { status: 500 }
        );
      }

      result = {
        applications: applications || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
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