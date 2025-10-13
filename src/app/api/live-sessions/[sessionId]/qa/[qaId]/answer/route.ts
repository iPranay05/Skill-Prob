import { NextRequest, NextResponse } from 'next/server';
import { LiveSessionService } from '../../../../../../../lib/liveSessionService';
import { verifyToken } from '../../../../../../../lib/auth';
import { AppError } from '../../../../../../../lib/errors';

const liveSessionService = new LiveSessionService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; qaId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const body = await request.json();
    const { answer } = body;

    if (!answer || answer.trim().length === 0) {
      return NextResponse.json(
        { error: 'Answer is required' },
        { status: 400 }
      );
    }

    // Only mentors can answer questions
    if (decoded.role !== 'mentor') {
      return NextResponse.json(
        { error: 'Only mentors can answer questions' },
        { status: 403 }
      );
    }

    const { qaId } = await params;
    const qa = await liveSessionService.answerQA({
      qaId,
      answer: answer.trim(),
      answeredBy: decoded.userId,
    });

    return NextResponse.json({
      success: true,
      data: qa,
    });
  } catch (error) {
    console.error('Error answering Q&A:', error);
    
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