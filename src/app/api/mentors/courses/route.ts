import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '../../../../lib/courseService';
import { verifyAuth } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { CourseStatus } from '../../../../models/Course';

const courseService = new CourseService();

/**
 * GET /api/mentors/courses - Get courses by authenticated mentor
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'mentor') {
      return NextResponse.json(
        { success: false, error: 'Only mentors can access this endpoint' },
        { status: 403 }
      );
    }

    const { userId } = authResult.user;
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
