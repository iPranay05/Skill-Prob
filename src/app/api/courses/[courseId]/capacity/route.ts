import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../../../lib/enrollmentService';
import { APIError } from '../../../../../lib/errors';

const enrollmentService = new EnrollmentService();

/**
 * GET /api/courses/[courseId]/capacity - Get course capacity information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const capacity = await enrollmentService.getCourseCapacity(courseId);

    return NextResponse.json({
      success: true,
      data: capacity
    });
  } catch (error) {
    console.error('Get course capacity error:', error);
    
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