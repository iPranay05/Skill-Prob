import { NextRequest, NextResponse } from 'next/server';
import { CourseContentService } from '../../../../../../lib/courseContentService';
import { AuthMiddleware } from '../../../../../../middleware/auth';
import { APIError } from '../../../../../../lib/errors';
import { UpdateChapterSchema } from '../../../../../../models/CourseContent';

const courseContentService = new CourseContentService();

/**
 * PUT /api/courses/[courseId]/chapters/[chapterId] - Update chapter (mentor only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string; chapterId: string } }
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
    const { courseId, chapterId } = params;
    const body = await request.json();

    // Validate request body
    const validatedData = UpdateChapterSchema.parse(body);

    // Update chapter
    const chapter = await courseContentService.updateChapter(chapterId, courseId, userId, validatedData);

    return NextResponse.json({
      success: true,
      data: chapter
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    
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

/**
 * DELETE /api/courses/[courseId]/chapters/[chapterId] - Delete chapter (mentor only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; chapterId: string } }
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
    const { courseId, chapterId } = params;

    // Delete chapter
    await courseContentService.deleteChapter(chapterId, courseId, userId);

    return NextResponse.json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    
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