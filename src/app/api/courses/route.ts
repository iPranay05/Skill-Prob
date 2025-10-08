import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '../../../lib/courseService';
import { AuthMiddleware } from '../../../middleware/auth';
import { UserRole } from '../../../types/user';
import { APIError } from '../../../lib/errors';
import { CreateCourseSchema, CourseSearchQuery } from '../../../models/Course';

const courseService = new CourseService();

/**
 * GET /api/courses - Search and filter courses
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: CourseSearchQuery = {
      search: searchParams.get('search') || undefined,
      filters: {
        category: searchParams.get('category') || undefined,
        type: searchParams.get('type') as any || undefined,
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
        rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
        tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
        mentor_id: searchParams.get('mentorId') || undefined,
        status: searchParams.get('status') as any || undefined
      },
      sortBy: searchParams.get('sortBy') as any || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10
    };

    const result = await courseService.searchCourses(query);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error searching courses:', error);
    
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

/**
 * POST /api/courses - Create a new course (mentor only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await AuthMiddleware.requireAuth(request, [UserRole.MENTOR]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { userId } = user;
    const body = await request.json();

    // Validate request body
    const validatedData = CreateCourseSchema.parse(body);

    // Create course
    const course = await courseService.createCourse(userId, validatedData);

    return NextResponse.json({
      success: true,
      data: course
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
