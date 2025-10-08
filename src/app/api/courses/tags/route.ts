import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '../../../../lib/courseService';
import { APIError } from '../../../../lib/errors';

const courseService = new CourseService();

/**
 * GET /api/courses/tags - Get popular course tags
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;

    const popularTags = await courseService.getPopularTags(limit);

    return NextResponse.json({
      success: true,
      data: popularTags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
