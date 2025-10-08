import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';

/**
 * GET /api/mentor/stats - Get mentor dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (decoded.role !== 'mentor') {
      return NextResponse.json({ error: 'Only mentors can access stats' }, { status: 403 });
    }

    const mentorId = decoded.userId;

    // Get total courses created by mentor
    const { count: totalCourses } = await supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('mentor_id', mentorId);

    // Get total students enrolled in mentor's courses
    const { data: enrollmentData } = await supabaseAdmin
      .from('course_enrollments')
      .select('user_id, courses!inner(mentor_id)')
      .eq('courses.mentor_id', mentorId)
      .eq('status', 'active');
    
    const uniqueStudents = new Set(enrollmentData?.map(e => e.user_id) || []);
    const totalStudents = uniqueStudents.size;

    // Get active live sessions
    const { count: activeSessions } = await supabaseAdmin
      .from('live_sessions')
      .select('*, courses!inner(mentor_id)', { count: 'exact', head: true })
      .eq('courses.mentor_id', mentorId)
      .eq('status', 'active');

    // Get upcoming sessions
    const { count: upcomingSessions } = await supabaseAdmin
      .from('live_sessions')
      .select('*, courses!inner(mentor_id)', { count: 'exact', head: true })
      .eq('courses.mentor_id', mentorId)
      .eq('status', 'scheduled')
      .gt('scheduled_start_time', new Date().toISOString());

    // Get completed sessions
    const { count: completedSessions } = await supabaseAdmin
      .from('live_sessions')
      .select('*, courses!inner(mentor_id)', { count: 'exact', head: true })
      .eq('courses.mentor_id', mentorId)
      .eq('status', 'completed');

    // For revenue calculations, we'll use simplified logic for now
    // In a real implementation, you'd want to use proper SQL aggregations
    const totalRevenue = 0; // Placeholder - would need complex joins
    const monthlyRevenue = 0; // Placeholder - would need complex joins

    // Calculate average rating from course reviews
    const { data: reviewData } = await supabaseAdmin
      .from('course_reviews')
      .select('rating, courses!inner(mentor_id)')
      .eq('courses.mentor_id', mentorId);
    
    const averageRating = reviewData && reviewData.length > 0 
      ? reviewData.reduce((sum, review) => sum + review.rating, 0) / reviewData.length
      : 0;

    const stats = {
      totalCourses: totalCourses || 0,
      totalStudents,
      activeSessions: activeSessions || 0,
      upcomingSessions: upcomingSessions || 0,
      completedSessions: completedSessions || 0,
      totalRevenue,
      monthlyRevenue,
      averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching mentor stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor statistics' },
      { status: 500 }
    );
  }
}
