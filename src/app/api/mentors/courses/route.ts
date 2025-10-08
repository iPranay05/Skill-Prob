import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '../../../../lib/courseService';
import { AuthMiddleware } from '../../../../middleware/auth';
import { APIError } from '../../../../lib/errors';
import { CourseStatus } from '../../../../models/Course';

const courseService = new CourseService();

/**
 * GET /api/mentors/courses - Get courses by authenticated mentor
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await authMiddleware(request, ['mentor']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const { userId } = authResult.user!;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CourseStatus | null;

    // Get mentor's courses
    const courses = await courseService.getCoursesByMentor(userId, status || undefined);

    return NextResponse.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching mentor courses:', error);
    
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
