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
    const { question, options, pollType, isAnonymous, endsAt } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required' },
        { status: 400 }
      );
    }

    // Only mentors can create polls
    if (authResult.user.role !== 'mentor') {
      return NextResponse.json(
        { error: 'Only mentors can create polls' },
        { status: 403 }
      );
    }

    const { sessionId } = await params;
    const poll = await liveSessionService.createPoll({
      sessionId,
      createdBy: authResult.user.userId,
      question: question.trim(),
      options: options.map((opt: any) => ({ text: opt.text })),
      pollType: pollType || 'single_choice',
      isAnonymous,
      endsAt: endsAt ? new Date(endsAt) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: poll,
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    
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