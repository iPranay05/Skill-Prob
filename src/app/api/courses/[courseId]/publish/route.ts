import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { APIError } from '../../../../../lib/errors';
import { UserRole } from '../../../../../types/user';
import { supabaseAdmin } from '../../../../../lib/database';
import { CourseStatus } from '../../../../../models/Course';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a mentor
    if (authResult.user.role !== UserRole.MENTOR) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Mentor role required.' },
        { status: 403 }
      );
    }

    const { courseId } = await params;

    // Update course status to published
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .update({
        status: CourseStatus.PUBLISHED,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .eq('mentor_id', authResult.user.userId) // Ensure mentor owns the course
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Course not found or access denied' },
          { status: 404 }
        );
      }
      throw new APIError(`Failed to publish course: ${error.message}`, 500);
    }

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course published successfully'
    });

  } catch (error) {
    console.error('Course publish error:', error);
    
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