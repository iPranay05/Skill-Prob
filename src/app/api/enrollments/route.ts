import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../lib/enrollmentService';
import { CreateEnrollmentInput, EnrollmentQuery } from '../../../models/Enrollment';
import { APIError } from '../../../lib/errors';
import { verifyJWT } from '../../../lib/auth';

const enrollmentService = new EnrollmentService();

/**
 * GET /api/enrollments - Get user's enrollments
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

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: EnrollmentQuery = {
      filters: {
        status: searchParams.get('status') as any || undefined,
        course_id: searchParams.get('course_id') || undefined,
        enrollment_source: searchParams.get('enrollment_source') || undefined,
        date_from: searchParams.get('date_from') ? new Date(searchParams.get('date_from')!) : undefined,
        date_to: searchParams.get('date_to') ? new Date(searchParams.get('date_to')!) : undefined
      },
      sortBy: (searchParams.get('sortBy') as any) || 'enrollment_date',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    const result = await enrollmentService.getStudentEnrollments(authResult.user.id, query);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    
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
 * POST /api/enrollments - Create new enrollment
 */
export async function POST(request: NextRequest) {
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
    
    // Validate required fields
    if (!body.course_id || !body.amount_paid) {
      return NextResponse.json(
        { success: false, error: 'Course ID and amount paid are required' },
        { status: 400 }
      );
    }

    // Prepare enrollment data
    const enrollmentData: CreateEnrollmentInput = {
      course_id: body.course_id,
      student_id: authResult.user.id,
      amount_paid: body.amount_paid,
      currency: body.currency || 'INR',
      payment_method: body.payment_method,
      transaction_id: body.transaction_id,
      subscription_id: body.subscription_id,
      enrollment_source: body.enrollment_source || 'direct',
      referral_code: body.referral_code,
      coupon_code: body.coupon_code,
      access_expires_at: body.access_expires_at ? new Date(body.access_expires_at) : undefined
    };

    const enrollment = await enrollmentService.enrollStudent(enrollmentData);

    return NextResponse.json({
      success: true,
      data: enrollment
    }, { status: 201 });
  } catch (error) {
    console.error('Create enrollment error:', error);
    
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
