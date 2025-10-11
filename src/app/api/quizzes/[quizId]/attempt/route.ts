import { NextRequest, NextResponse } from 'next/server';
import { StudentLearningService } from '@/lib/studentLearningService';
import { verifyToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const attempt = await StudentLearningService.startQuizAttempt(
      params.quizId,
      decoded.userId
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
  { params }: { params: { quizId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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