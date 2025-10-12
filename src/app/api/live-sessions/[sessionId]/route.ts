import { NextRequest, NextResponse } from 'next/server';
import { LiveSessionService } from '../../../../lib/liveSessionService';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';

const liveSessionService = new LiveSessionService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const { sessionId } = await params;
    const session = await liveSessionService.getSessionById(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error fetching live session:', error);

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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (decoded.role !== 'mentor') {
      return NextResponse.json({ error: 'Only mentors can update live sessions' }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId } = await params;
    const {
      title,
      description,
      scheduledStartTime,
      scheduledEndTime,
      maxParticipants,
      chatEnabled,
      qaEnabled,
      pollingEnabled,
      status,
    } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduledStartTime) updateData.scheduledStartTime = new Date(scheduledStartTime);
    if (scheduledEndTime) updateData.scheduledEndTime = new Date(scheduledEndTime);
    if (maxParticipants) updateData.maxParticipants = maxParticipants;
    if (chatEnabled !== undefined) updateData.chatEnabled = chatEnabled;
    if (qaEnabled !== undefined) updateData.qaEnabled = qaEnabled;
    if (pollingEnabled !== undefined) updateData.pollingEnabled = pollingEnabled;
    if (status) updateData.status = status;

    // Validate time range if both times are provided
    if (updateData.scheduledStartTime && updateData.scheduledEndTime) {
      if (updateData.scheduledStartTime >= updateData.scheduledEndTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    const session = await liveSessionService.updateLiveSession(
      sessionId,
      decoded.userId,
      updateData
    );

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error updating live session:', error);

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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (decoded.role !== 'mentor') {
      return NextResponse.json({ error: 'Only mentors can delete live sessions' }, { status: 403 });
    }

    const { sessionId } = await params;
    // Update session status to cancelled instead of deleting
    await liveSessionService.updateLiveSession(
      sessionId,
      decoded.userId,
      { status: 'cancelled' }
    );

    return NextResponse.json({
      success: true,
      message: 'Session cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling live session:', error);

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