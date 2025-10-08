import { NextRequest, NextResponse } from 'next/server';
import { LiveSessionService } from '../../../../../lib/liveSessionService';
import { verifyToken } from '../../../../../lib/auth';
import { APIError } from '../../../../../lib/errors';

const liveSessionService = new LiveSessionService();

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    
    // Only students can join sessions through this endpoint
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can join sessions' }, { status: 403 });
    }

    const attendance = await liveSessionService.joinSession({
      sessionId: params.sessionId,
      studentId: decoded.userId,
    });

    // Get session details to return the Google Meet link
    const session = await liveSessionService.getSessionById(params.sessionId);

    return NextResponse.json({
      success: true,
      data: {
        attendance,
        meetLink: session?.googleMeetLink,
        sessionDetails: {
          title: session?.title,
          scheduledStartTime: session?.scheduledStartTime,
          scheduledEndTime: session?.scheduledEndTime,
          status: session?.status,
        },
      },
    });
  } catch (error) {
    console.error('Error joining live session:', error);
    
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
  { params }: { params: { sessionId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can leave sessions' }, { status: 403 });
    }

    await liveSessionService.leaveSession(params.sessionId, decoded.userId);

    return NextResponse.json({
      success: true,
      message: 'Left session successfully',
    });
  } catch (error) {
    console.error('Error leaving live session:', error);
    
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