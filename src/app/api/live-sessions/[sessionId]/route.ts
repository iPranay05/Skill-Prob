import { NextRequest, NextResponse } from 'next/server';
import { LiveSessionService } from '../../../../lib/liveSessionService';
import { verifyAuth } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';

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

    const { sessionId } = await params;
    const session = await liveSessionService.getSessionById(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching session:', error);

    if (error instanceof APIError) {
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
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only mentors can update sessions
    if (authResult.user.role !== 'mentor') {
      return NextResponse.json(
        { error: 'Only mentors can update sessions' },
        { status: 403 }
      );
    }

    const { sessionId } = await params;
    const body = await request.json();

    const updatedSession = await liveSessionService.updateLiveSession(
      sessionId,
      authResult.user.userId,
      body
    );

    return NextResponse.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);

    if (error instanceof APIError) {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only mentors can delete sessions
    if (authResult.user.role !== 'mentor') {
      return NextResponse.json(
        { error: 'Only mentors can delete sessions' },
        { status: 403 }
      );
    }

    const { sessionId } = await params;

    await liveSessionService.updateLiveSession(
      sessionId,
      authResult.user.userId,
      { status: 'cancelled' }
    );

    return NextResponse.json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);

    if (error instanceof APIError) {
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