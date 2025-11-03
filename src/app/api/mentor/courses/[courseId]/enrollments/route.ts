import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Verify authentication and mentor role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'mentor') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Mentor role required.' },
        { status: 403 }
      );
    }

    const { courseId } = await params;

    // First verify that the mentor owns this course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('mentor_id', authResult.user.userId)
      .single();

    if (courseError) {
      if (courseError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Course not found or access denied' },
          { status: 404 }
        );
      }
      console.error('Error verifying course ownership:', courseError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify course access' },
        { status: 500 }
      );
    }

    // Fetch enrollments for this course
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        progress,
        completed,
        enrolled_at,
        last_accessed,
        users (
          id,
          email,
          profile
        )
      `)
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false });

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    // Format enrollment data
    const formattedEnrollments = enrollments?.map((enrollment: any) => ({
      id: enrollment.id,
      studentName: `${enrollment.users.profile?.firstName || ''} ${enrollment.users.profile?.lastName || ''}`.trim() || 'Unknown',
      studentEmail: enrollment.users.email,
      enrolledAt: enrollment.enrolled_at,
      progress: enrollment.progress || 0,
      completed: enrollment.completed || false,
      lastAccessed: enrollment.last_accessed || enrollment.enrolled_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedEnrollments
    });

  } catch (error) {
    console.error('Course enrollments fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}