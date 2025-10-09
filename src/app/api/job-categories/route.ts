import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';

export async function GET(request: NextRequest) {
  try {
    const categories = await JobService.getJobCategories();

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Error fetching job categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_CATEGORIES_ERROR',
          message: error.message || 'Failed to fetch job categories'
        }
      },
      { status: error.status || 500 }
    );
  }
}