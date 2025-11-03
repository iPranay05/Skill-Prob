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

    // Fetch course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('mentor_id', authResult.user.userId) // Ensure mentor owns this course
      .single();

    if (courseError) {
      if (courseError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Course not found or access denied' },
          { status: 404 }
        );
      }
      console.error('Error fetching course:', courseError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch course' },
        { status: 500 }
      );
    }

    // Get enrollment count
    const { count: enrollmentCount, error: countError } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (countError) {
      console.error('Error counting enrollments:', countError);
    }

    // Get average rating (if reviews table exists)
    let averageRating = 0;
    try {
      const { data: reviews, error: reviewsError } = await supabaseAdmin
        .from('course_reviews')
        .select('rating')
        .eq('course_id', courseId);

      if (!reviewsError && reviews && reviews.length > 0) {
        averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
      }
    } catch (error) {
      // Reviews table might not exist, ignore error
      console.log('Reviews table not found, using default rating');
    }

    // Format course data
    const courseData = {
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.pricing?.amount || 0,
      category: course.category_id || 'General',
      level: 'Beginner', // Default since level column doesn't exist
      duration: 'Self-paced', // Default since duration column doesn't exist
      thumbnail: course.media?.thumbnail,
      status: course.status || 'draft',
      enrollmentCount: enrollmentCount || 0,
      rating: averageRating,
      createdAt: course.created_at,
      updatedAt: course.updated_at
    };

    return NextResponse.json({
      success: true,
      data: courseData
    });

  } catch (error) {
    console.error('Mentor course fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}