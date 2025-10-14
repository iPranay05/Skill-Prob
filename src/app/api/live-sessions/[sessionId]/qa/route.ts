import { NextRequest, NextResponse } from 'next/server';
import { LiveSessionService } from '../../../../../lib/liveSessionService';
import { verifyAuth } from '../../../../../lib/auth';
import { AppError } from '../../../../../lib/errors';

const liveSessionService = new LiveSessionService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const body = await request.json();
    const { question, isAnonymous } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Only students can ask questions
    if (authResult.user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can ask questions' },
        { status: 403 }
      );
    }

    const { sessionId } = await params;
    const qa = await liveSessionService.createQA({
      sessionId,
      studentId: authResult.user.userId,
      question: question.trim(),
      isAnonymous,
    });

    return NextResponse.json({
      success: true,
      data: qa,
    });
  } catch (error) {
    console.error('Error creating Q&A:', error);
    
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