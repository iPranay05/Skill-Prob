import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyToken } from '@/lib/auth';
import { JobType, ExperienceLevel, WorkMode } from '@/models/Job';

export async function GET(request: NextRequest) {
  try {
    const { success, user } = await verifyToken(request);
    
    if (!success || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a student
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Access denied. Student role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse search parameters
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') as JobType || undefined;
    const experience_level = searchParams.get('experience_level') as ExperienceLevel || undefined;
    const work_mode = searchParams.get('work_mode') as WorkMode || undefined;
    const location = searchParams.get('location') || undefined;
    const salary_min = searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min')!) : undefined;
    const featured = searchParams.get('featured') ? searchParams.get('featured') === 'true' : undefined;
    const remote_friendly = searchParams.get('remote_friendly') ? searchParams.get('remote_friendly') === 'true' : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') as 'title' | 'company_name' | 'salary_min' | 'published_at' | 'application_deadline' || 'published_at';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    // Build search query
    const searchQuery = {
      search,
      filters: {
        type,
        experience_level,
        work_mode,
        location,
        salary_min,
        featured,
        remote_friendly
      },
      sortBy,
      sortOrder,
      page,
      limit
    };

    // Remove undefined values from filters
    Object.keys(searchQuery.filters).forEach(key => {
      if (searchQuery.filters[key as keyof typeof searchQuery.filters] === undefined) {
        delete searchQuery.filters[key as keyof typeof searchQuery.filters];
      }
    });

    // Search for jobs
    const result = await JobService.searchJobPostings(searchQuery);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error searching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    );
  }
}