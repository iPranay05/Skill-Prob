import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { CreateJobPostingSchema, JobSearchQuery } from '@/models/Job';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build search query from URL parameters
    const query: JobSearchQuery = {
      search: searchParams.get('search') || undefined,
      filters: {
        type: searchParams.get('type') as any || undefined,
        experience_level: searchParams.get('experience_level') as any || undefined,
        work_mode: searchParams.get('work_mode') as any || undefined,
        location: searchParams.get('location') || undefined,
        salary_min: searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min')!) : undefined,
        salary_max: searchParams.get('salary_max') ? parseInt(searchParams.get('salary_max')!) : undefined,
        company_name: searchParams.get('company_name') || undefined,
        featured: searchParams.get('featured') === 'true' ? true : undefined,
        remote_friendly: searchParams.get('remote_friendly') === 'true' ? true : undefined,
        category_ids: searchParams.get('category_ids')?.split(',') || undefined
      },
      sortBy: searchParams.get('sortBy') as any || 'published_at',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    };

    // Remove undefined values from filters
    Object.keys(query.filters!).forEach(key => {
      if (query.filters![key as keyof typeof query.filters] === undefined) {
        delete query.filters![key as keyof typeof query.filters];
      }
    });

    const result = await JobService.searchJobPostings(query);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to search jobs'
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

    // Check if user is employer or admin
    if (!['employer', 'admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only employers and admins can create job postings'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = CreateJobPostingSchema.safeParse({
      ...body,
      employer_id: authResult.user.userId
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid job posting data',
            details: validationResult.error.issues
          }
        },
        { status: 400 }
      );
    }

    const jobPosting = await JobService.createJobPosting(validationResult.data);

    return NextResponse.json({
      success: true,
      data: jobPosting
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating job posting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create job posting'
        }
      },
      { status: 500 }
    );
  }
}