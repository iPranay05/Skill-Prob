import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../../lib/enrollmentService';
import { APIError } from '../../../../lib/errors';
import { verifyJWT } from '../../../../lib/auth';

const enrollmentService = new EnrollmentService();

/**
 * GET /api/enrollments/stats - Get enrollment statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view stats
    const isAdmin = authResult.user.role === 'admin' || authResult.user.role === 'super_admin';
    const isMentor = authResult.user.role === 'mentor';
    
    if (!isAdmin && !isMentor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view enrollment statistics' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: any = {};
    
    if (searchParams.get('course_id')) {
      filters.course_id = searchParams.get('course_id');
    }
    
    if (searchParams.get('date_from')) {
      filters.date_from = new Date(searchParams.get('date_from')!);
    }
    
    if (searchParams.get('date_to')) {
      filters.date_to = new Date(searchParams.get('date_to')!);
    }

    // For mentors, only show their own course stats
    if (isMentor && !isAdmin) {
      filters.mentor_id = authResult.user.id;
    }

    const stats = await enrollmentService.getEnrollmentStats(filters);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get enrollment stats error:', error);
    
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
