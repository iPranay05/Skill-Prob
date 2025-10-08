import { NextRequest, NextResponse } from 'next/server';
import { CourseContentService } from '../../../../../lib/courseContentService';
import { APIError } from '../../../../../lib/errors';

const courseContentService = new CourseContentService();

/**
 * GET /api/courses/[courseId]/structure - Get complete course structure with chapters, content, and resources
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    
    const structure = await courseContentService.getCourseStructure(courseId);

    return NextResponse.json({
      success: true,
      data: structure
    });
  } catch (error) {
    console.error('Error fetching course structure:', error);
    
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