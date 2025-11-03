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
      .select('id, title, description, pricing, category_id, type, status, created_at, updated_at')
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

    // Format courses data
    const formattedCourses = courses?.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.pricing?.amount || 0,
      category: course.category_id,
      level: 'Beginner', // Default since level column doesn't exist
      status: course.status,
      type: course.type,
      createdAt: course.created_at,
      updatedAt: course.updated_at
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