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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabaseAdmin
      .from('courses')
      .select('id, title, description, pricing, category_id, type, status, media, enrollment, created_at, updated_at')
      .eq('mentor_id', authResult.user.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: courses, error: coursesError } = await query;

    if (coursesError) {
      console.error('Error fetching mentor courses:', coursesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('mentor_id', authResult.user.userId);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting courses:', countError);
    }

    // Get enrollment counts for all courses
    const courseIds = courses?.map(course => course.id) || [];
    let enrollmentCounts: Record<string, number> = {};

    if (courseIds.length > 0) {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('course_id')
        .in('course_id', courseIds);

      // Count enrollments per course
      enrollmentCounts = enrollments?.reduce((acc, enrollment) => {
        acc[enrollment.course_id] = (acc[enrollment.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
    }

    // Format courses data
    const formattedCourses = courses?.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      mentor_id: authResult.user.userId,
      category_id: course.category_id,
      category: course.category_id || 'General',
      tags: [],
      type: course.type,
      pricing: {
        amount: course.pricing?.amount || 0,
        currency: course.pricing?.currency || 'INR',
        subscriptionType: course.pricing?.subscriptionType || 'one-time'
      },
      content: {
        syllabus: [],
        prerequisites: [],
        learningOutcomes: []
      },
      media: course.media || {
        resources: []
      },
      enrollment: {
        currentEnrollment: enrollmentCounts[course.id] || 0,
        maxStudents: course.enrollment?.maxStudents,
        enrolledStudents: []
      },
      ratings: {
        average: 0,
        count: 0,
        reviews: []
      },
      status: course.status,
      created_at: new Date(course.created_at),
      updated_at: new Date(course.updated_at)
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        courses: formattedCourses,
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit
      }
    });

  } catch (error) {
    console.error('Mentor courses fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}