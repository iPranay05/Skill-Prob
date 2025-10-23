import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
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

    const { courseId } = await context.params;
    const userId = authResult.user.userId;

    // Check if student is enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        short_description,
        type,
        status,
        pricing,
        content,
        media,
        created_at
      `)
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // For now, return the course structure from the content field
    // Later we can expand this to use separate chapters/lessons tables
    const courseContent = {
      ...course,
      enrollment: {
        enrolledAt: enrollment.enrolled_at,
        progress: enrollment.progress,
        status: enrollment.status
      }
    };

    return NextResponse.json({
      success: true,
      data: courseContent
    });

  } catch (error) {
    console.error('Student content fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
