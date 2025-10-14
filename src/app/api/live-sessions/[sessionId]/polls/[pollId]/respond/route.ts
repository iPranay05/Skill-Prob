import { NextRequest, NextResponse } from 'next/server';
import { LiveSessionService } from '../../../../../../../lib/liveSessionService';
import { verifyAuth } from '../../../../../../../lib/auth';
import { AppError } from '../../../../../../../lib/errors';

const liveSessionService = new LiveSessionService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; pollId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const body = await request.json();
    const { response } = body;

    if (response === undefined || response === null) {
      return NextResponse.json(
        { error: 'Response is required' },
        { status: 400 }
      );
    }

    const { pollId } = await params;
    const pollResponse = await liveSessionService.submitPollResponse({
      pollId,
      userId: authResult.user.userId,
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