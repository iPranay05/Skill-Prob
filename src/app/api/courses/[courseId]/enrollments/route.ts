import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../../../lib/enrollmentService';
import { EnrollmentQuery } from '../../../../../models/Enrollment';
import { APIError } from '../../../../../lib/errors';
import { verifyJWT } from '../../../../../lib/auth';

const enrollmentService = new EnrollmentService();

/**
 * GET /api/courses/[courseId]/enrollments - Get course enrollments (for mentors/admins)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view course enrollments
    // This should be mentor of the course or admin
    const isAdmin = authResult.user.role === 'admin' || authResult.user.role === 'super_admin';
    
    // For mentors, we would need to verify they own the course
    // This is a simplified check - in production, verify course ownership
    if (!isAdmin && authResult.user.role !== 'mentor') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view course enrollments' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: EnrollmentQuery = {
      filters: {
        status: searchParams.get('status') as any || undefined,
        enrollment_source: searchParams.get('enrollment_source') || undefined,
        date_from: searchParams.get('date_from') ? new Date(searchParams.get('date_from')!) : undefined,
        date_to: searchParams.get('date_to') ? new Date(searchParams.get('date_to')!) : undefined
      },
      sortBy: (searchParams.get('sortBy') as any) || 'enrollment_date',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    const result = await enrollmentService.getCourseEnrollments(params.courseId, query);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    
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