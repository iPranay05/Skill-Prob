import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { UserRole } from '../../../../types/user';
import { supabaseAdmin } from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== UserRole.ADMIN && authResult.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with mentor information
    let query = supabaseAdmin
      .from('courses')
      .select(`
        id,
        title,
        description,
        mentor_id,
        category,
        type,
        pricing,
        enrollment,
        status,
        ratings,
        created_at,
        updated_at,
        users!courses_mentor_id_fkey(
          id,
          profile
        )
      `)
      .order('updated_at', { ascending: false });

    // Apply filters
    if (filter !== 'all') {
      if (['draft', 'published', 'archived', 'pending_review'].includes(filter)) {
        query = query.eq('status', filter);
      } else {
        // Filter by category
        query = query.ilike('category', `%${filter}%`);
      }
    }

    // Apply search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    // Apply pagination
    const { data: courses, error, count } = await query
      .range(offset, offset + limit - 1)
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Courses query error:', error);
      throw new APIError(`Failed to fetch courses: ${error.message}`, 500);
    }

    // Get enrollment counts for each course
    const courseIds = courses?.map(course => course.id) || [];
    const { data: enrollmentCounts } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .in('course_id', courseIds);

    const enrollmentCountMap = enrollmentCounts?.reduce((acc, enrollment) => {
      acc[enrollment.course_id] = (acc[enrollment.course_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Format the response
    const formattedCourses = courses?.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      mentorId: course.mentor_id,
      mentorName: course.users?.profile?.firstName && course.users?.profile?.lastName
        ? `${course.users.profile.firstName} ${course.users.profile.lastName}`
        : course.users?.profile?.firstName || 'Unknown Mentor',
      category: course.category,
      type: course.type,
      pricing: course.pricing || { amount: 0, currency: 'INR', subscriptionType: 'one-time' },
      enrollment: {
        maxStudents: course.enrollment?.maxStudents,
        currentEnrollment: enrollmentCountMap[course.id] || 0
      },
      status: course.status,
      ratings: course.ratings || { average: 0, count: 0 },
      createdAt: course.created_at,
      updatedAt: course.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedCourses,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Admin courses fetch error:', error);
    
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