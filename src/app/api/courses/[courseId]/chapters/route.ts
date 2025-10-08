import { NextRequest, NextResponse } from 'next/server';
import { CourseContentService } from '../../../../../lib/courseContentService';
import { AuthMiddleware } from '../../../../../middleware/auth';
import { APIError } from '../../../../../lib/errors';
import { CreateChapterSchema } from '../../../../../models/CourseContent';

const courseContentService = new CourseContentService();

/**
 * GET /api/courses/[courseId]/chapters - Get chapters for a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    
    const chapters = await courseContentService.getChaptersByCourse(courseId);

    return NextResponse.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    
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
 * POST /api/courses/[courseId]/chapters - Create a new chapter (mentor only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Authenticate and authorize
    const authResult = await authMiddleware(request, ['mentor']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const { userId } = authResult.user!;
    const { courseId } = params;
    const body = await request.json();

    // Validate request body
    const validatedData = CreateChapterSchema.parse(body);

    // Create chapter
    const chapter = await courseContentService.createChapter(courseId, userId, validatedData);

    return NextResponse.json({
      success: true,
      data: chapter
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chapter:', error);
    
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