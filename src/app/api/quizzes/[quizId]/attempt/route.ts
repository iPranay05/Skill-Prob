import { NextRequest, NextResponse } from 'next/server';
import { StudentLearningService } from '@/lib/studentLearningService';
import { verifyAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params;
    const attempt = await StudentLearningService.startQuizAttempt(
      quizId,
      authResult.user.userId
    );

    return NextResponse.json({
      success: true,
      data: { attempt }
    });
  } catch (error) {
    console.error('Error starting quiz attempt:', error);
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId, answers } = await request.json();

    if (!attemptId || !answers) {
      return NextResponse.json(
        { error: 'Attempt ID and answers are required' },
        { status: 400 }
      );
    }

    const attempt = await StudentLearningService.submitQuizAttempt(
      attemptId,
      answers
    );

    return NextResponse.json({
      success: true,
      data: { attempt }
    });
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    
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