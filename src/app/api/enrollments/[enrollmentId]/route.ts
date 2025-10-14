import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../../lib/enrollmentService';
import { EnrollmentStatus } from '../../../../models/Enrollment';
import { APIError } from '../../../../lib/errors';
import { verifyJWT } from '../../../../lib/auth';

const enrollmentService = new EnrollmentService();

/**
 * GET /api/enrollments/[enrollmentId] - Get enrollment by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
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

    const { enrollmentId } = await params;
    const enrollment = await enrollmentService.getEnrollmentById(enrollmentId);
    
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this enrollment
    const isStudent = enrollment.student_id === authResult.user.userId;
    const isAdmin = authResult.user.role === 'admin' || authResult.user.role === 'super_admin';
    
    // For mentors, we need to check if they own the course (this would require joining with courses table)
    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view this enrollment' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    
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

/**
 * PATCH /api/enrollments/[enrollmentId] - Update enrollment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
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

    const body = await request.json();
    
    const { enrollmentId } = await params;
    
    // Handle status updates
    if (body.status) {
      const enrollment = await enrollmentService.updateEnrollmentStatus(
        enrollmentId,
        body.status as EnrollmentStatus,
        authResult.user.userId
      );

      return NextResponse.json({
        success: true,
        data: enrollment
      });
    }

    // Handle progress updates
    if (body.progress) {
      const enrollment = await enrollmentService.updateEnrollmentProgress(
        enrollmentId,
        authResult.user.userId,
        body.progress
      );

      return NextResponse.json({
        success: true,
        data: enrollment
      });
    }

    return NextResponse.json(
      { success: false, error: 'No valid update data provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update enrollment error:', error);
    
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