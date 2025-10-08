import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';

/**
 * GET /api/mentor/activity - Get recent mentor activity
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (decoded.role !== 'mentor') {
      return NextResponse.json({ error: 'Only mentors can access activity' }, { status: 403 });
    }

    const mentorId = decoded.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent activity from multiple sources
    const activities: any[] = [];

    // Recent enrollments in mentor's courses
    const { data: enrollments } = await supabaseAdmin
      .from('course_enrollments')
      .select(`
        created_at,
        courses!inner(id, title, mentor_id),
        users!inner(id, profile)
      `)
      .eq('courses.mentor_id', mentorId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(Math.ceil(limit / 3));

    if (enrollments) {
      enrollments.forEach((enrollment: any) => {
        const studentName = enrollment.users?.profile?.firstName || 'Student';
        activities.push({
          type: 'new_enrollment',
          title: 'New student enrolled',
          description: `${studentName} enrolled in ${enrollment.courses.title}`,
          timestamp: enrollment.created_at,
          metadata: {
            course_id: enrollment.courses.id,
            course_title: enrollment.courses.title,
            student_name: studentName
          }
        });
      });
    }

    // Recent live sessions completed
    const { data: sessions } = await supabaseAdmin
      .from('live_sessions')
      .select(`
        id,
        title,
        updated_at,
        courses!inner(id, title, mentor_id)
      `)
      .eq('courses.mentor_id', mentorId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(Math.ceil(limit / 3));

    if (sessions) {
      sessions.forEach((session: any) => {
        activities.push({
          type: 'session_completed',
          title: 'Live session completed',
          description: `Completed session: ${session.title}`,
          timestamp: session.updated_at,
          metadata: {
            session_id: session.id,
            session_title: session.title,
            course_title: session.courses.title
          }
        });
      });
    }

    // Recent course creations/updates
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id, title, updated_at')
      .eq('mentor_id', mentorId)
      .order('updated_at', { ascending: false })
      .limit(Math.ceil(limit / 3));

    if (courses) {
      courses.forEach((course: any) => {
        activities.push({
          type: 'course_created',
          title: 'Course updated',
          description: `Updated course: ${course.title}`,
          timestamp: course.updated_at,
          metadata: {
            course_id: course.id,
            course_title: course.title
          }
        });
      });
    }

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map((activity, index) => ({
        id: `activity_${index}_${Date.now()}`,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        metadata: activity.metadata
      }));

    return NextResponse.json({
      success: true,
      data: sortedActivities
    });

  } catch (error) {
    console.error('Error fetching mentor activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor activity' },
      { status: 500 }
    );
  }
}
