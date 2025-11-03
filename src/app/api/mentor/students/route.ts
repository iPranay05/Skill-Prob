import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';

export async function GET(request: NextRequest) {
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

    // Get mentor's courses
    const { data: mentorCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('mentor_id', authResult.user.userId);

    if (coursesError) {
      console.error('Error fetching mentor courses:', coursesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch mentor courses' },
        { status: 500 }
      );
    }

    if (!mentorCourses || mentorCourses.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const courseIds = mentorCourses.map(course => course.id);

    // Get students enrolled in mentor's courses
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        user_id,
        progress,
        completed,
        enrolled_at,
        users (
          id,
          email,
          profile,
          created_at
        )
      `)
      .in('course_id', courseIds);

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch student enrollments' },
        { status: 500 }
      );
    }

    // Process student data
    const studentMap = new Map();
    
    enrollments?.forEach((enrollment: any) => {
      const userId = enrollment.user_id;
      const user = enrollment.users;
      
      if (!studentMap.has(userId)) {
        studentMap.set(userId, {
          id: userId,
          name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown',
          email: user.email,
          avatar: user.profile?.avatar,
          enrolledCourses: 0,
          completedCourses: 0,
          totalProgress: 0,
          lastActive: enrollment.enrolled_at,
          joinedDate: user.created_at,
          status: 'active',
          progressSum: 0
        });
      }
      
      const student = studentMap.get(userId);
      student.enrolledCourses += 1;
      student.progressSum += enrollment.progress || 0;
      
      if (enrollment.completed) {
        student.completedCourses += 1;
      }
      
      // Update last active if this enrollment is more recent
      if (new Date(enrollment.enrolled_at) > new Date(student.lastActive)) {
        student.lastActive = enrollment.enrolled_at;
      }
    });

    // Calculate average progress and determine status
    const students = Array.from(studentMap.values()).map(student => {
      student.totalProgress = Math.round(student.progressSum / student.enrolledCourses);
      
      // Determine if student is active (last active within 7 days)
      const lastActiveDate = new Date(student.lastActive);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      student.status = lastActiveDate > sevenDaysAgo ? 'active' : 'inactive';
      
      // Clean up temporary field
      delete student.progressSum;
      
      return student;
    });

    // Sort by last active (most recent first)
    students.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

    return NextResponse.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Mentor students fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}