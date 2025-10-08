import { NextRequest, NextResponse } from 'next/server';
import { LiveSessionService } from '../../../../../../../lib/liveSessionService';
import { verifyToken } from '../../../../../../../lib/auth';
import { AppError } from '../../../../../../../lib/errors';

const liveSessionService = new LiveSessionService();

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string; pollId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const body = await request.json();
    const { response } = body;

    if (response === undefined || response === null) {
      return NextResponse.json(
        { error: 'Response is required' },
        { status: 400 }
      );
    }

    const pollResponse = await liveSessionService.submitPollResponse({
      pollId: params.pollId,
      userId: decoded.userId,
      response,
    });

    return NextResponse.json({
      success: true,
      data: pollResponse,
    });
  } catch (error) {
    console.error('Error submitting poll response:', error);
    
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