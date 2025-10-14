import { NextRequest, NextResponse } from 'next/server';
import { CourseContentService } from '../../../../../../../lib/courseContentService';
import { verifyAuth } from '../../../../../../../lib/auth';
import { APIError } from '../../../../../../../lib/errors';
import { CreateContentSchema } from '../../../../../../../models/CourseContent';

const courseContentService = new CourseContentService();

/**
 * GET /api/courses/[courseId]/chapters/[chapterId]/content - Get content for a chapter
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    
    const content = await courseContentService.getContentByChapter(chapterId);

    return NextResponse.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    
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
 * POST /api/courses/[courseId]/chapters/[chapterId]/content - Create new content (mentor only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    // Authenticate and authorize
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is a mentor
    if (authResult.user.role !== 'mentor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = authResult.user;
    const { courseId, chapterId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = CreateContentSchema.parse(body);

    // Create content
    const content = await courseContentService.createContent(chapterId, courseId, userId, validatedData);

    return NextResponse.json({
      success: true,
      data: content
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating content:', error);
    
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