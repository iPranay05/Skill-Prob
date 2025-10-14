import { NextRequest, NextResponse } from 'next/server';
import { LiveSessionService } from '../../../../../lib/liveSessionService';
import { verifyAuth } from '../../../../../lib/auth';
import { AppError } from '../../../../../lib/errors';

const liveSessionService = new LiveSessionService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const { sessionId } = await params;

    const messages = await liveSessionService.getChatMessages(sessionId, limit);

    return NextResponse.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { sessionId } = await params;
    const { message, messageType = 'text' } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const chatMessage = await liveSessionService.sendChatMessage({
      sessionId,
      userId: authResult.user.userId,
      message,
      messageType
    });

    return NextResponse.json({
      success: true,
      data: chatMessage
    });
  } catch (error) {
    console.error('Error sending chat message:', error);

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