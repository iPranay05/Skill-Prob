import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '../../../../../lib/courseService';
import { AuthMiddleware } from '../../../../../middleware/auth';
import { AppError } from '../../../../../lib/errors';

const courseService = new CourseService();

/**
 * POST /api/courses/[courseId]/publish - Publish course (mentor only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
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
    const { courseId } = params;

    // Publish course
    const course = await courseService.publishCourse(courseId, userId);

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course published successfully'
    });
  } catch (error) {
    console.error('Error publishing course:', error);
    
    if (error instanceof AppError) {
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

/**
 * DELETE /api/courses/[courseId]/publish - Unpublish course (mentor only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
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
    const { courseId } = params;

    // Unpublish course
    const course = await courseService.unpublishCourse(courseId, userId);

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course unpublished successfully'
    });
  } catch (error) {
    console.error('Error unpublishing course:', error);
    
    if (error instanceof AppError) {
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