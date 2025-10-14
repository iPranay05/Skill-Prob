import { NextRequest, NextResponse } from 'next/server';
import { CourseContentService } from '../../../../../lib/courseContentService';
import { verifyAuth } from '../../../../../lib/auth';
import { APIError } from '../../../../../lib/errors';
import { CreateResourceSchema } from '../../../../../models/CourseContent';

const courseContentService = new CourseContentService();

/**
 * GET /api/courses/[courseId]/resources - Get resources for a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    const resources = await courseContentService.getResourcesByCourse(courseId);

    return NextResponse.json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    
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
 * POST /api/courses/[courseId]/resources - Create a new resource (mentor only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
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
    const { courseId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = CreateResourceSchema.parse(body);

    // Create resource
    const resource = await courseContentService.createResource(courseId, userId, validatedData);

    return NextResponse.json({
      success: true,
      data: resource
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    
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