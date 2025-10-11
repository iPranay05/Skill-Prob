import { NextRequest, NextResponse } from 'next/server';
import { StudentCareerService } from '@/lib/studentCareerService';
import { verifyToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      type: searchParams.get('type') || undefined,
      experience_level: searchParams.get('experience_level') || undefined,
      work_mode: searchParams.get('work_mode') || undefined,
      location: searchParams.get('location') || undefined,
      keywords: searchParams.get('keywords') || undefined,
      salary_min: searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min')!) : undefined,
      featured_only: searchParams.get('featured_only') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      category_ids: searchParams.get('category_ids')?.split(',') || undefined
    };

    const result = await StudentCareerService.getJobPostings(filters);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}