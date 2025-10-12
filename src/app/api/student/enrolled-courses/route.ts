import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';
import { ErrorHandler } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a student
    if (authResult.user.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Student role required.' },
        { status: 403 }
      );
    }

    // Get enrolled courses
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        status,
        progress,
        courses (
          id,
          title,
          description,
          category,
          level,
          duration,
          price,
          thumbnail_url,
          mentor_id,
          users!courses_mentor_id_fkey (
            profile
          )
        )
      `)
      .eq('student_id', authResult.user.userId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false });

    if (enrollmentError) {
      console.error('Error fetching enrolled courses:', enrollmentError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch enrolled courses' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedCourses = (enrollments || []).map(enrollment => ({
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.enrolled_at,
      progress: enrollment.progress || 0,
      status: enrollment.status,
      course: {
        id: enrollment.courses.id,
        title: enrollment.courses.title,
        description: enrollment.courses.description,
        category: enrollment.courses.category,
        level: enrollment.courses.level,
        duration: enrollment.courses.duration,
        price: enrollment.courses.price,
        thumbnailUrl: enrollment.courses.thumbnail_url,
        mentorName: enrollment.courses.users?.profile?.firstName 
          ? `${enrollment.courses.users.profile.firstName} ${enrollment.courses.users.profile.lastName || ''}`.trim()
          : 'Unknown Mentor'
      }
    }));

    return NextResponse.json({
      success: true,
      data: formattedCourses,
      total: formattedCourses.length
    });

  } catch (error) {
    console.error('Student enrolled courses error:', error);
    return ErrorHandler.handle(error);
  }
}