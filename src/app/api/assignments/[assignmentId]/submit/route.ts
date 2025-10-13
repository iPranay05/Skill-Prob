import { NextRequest, NextResponse } from 'next/server';
import { StudentLearningService } from '@/lib/studentLearningService';
import { verifyAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_text, file_urls } = await request.json();
    const { assignmentId } = await params;

    const submission = await StudentLearningService.submitAssignment(
      assignmentId,
      authResult.user.userId,
      { submission_text, file_urls }
    );

    return NextResponse.json({
      success: true,
      data: { submission }
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId } = await params;
    const submission = await StudentLearningService.getAssignmentSubmission(
      assignmentId,
      authResult.user.userId
    );

    return NextResponse.json({
      success: true,
      data: { submission }
    });
  } catch (error) {
    console.error('Error fetching assignment submission:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}