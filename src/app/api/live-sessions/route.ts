import { NextRequest, NextResponse } from 'next/server';
import { LiveSessionService } from '../../../lib/liveSessionService';
import { verifyToken } from '../../../lib/auth';
import { APIError } from '../../../lib/errors';

const liveSessionService = new LiveSessionService();

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (decoded.role !== 'mentor') {
      return NextResponse.json({ error: 'Only mentors can create live sessions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      courseId,
      title,
      description,
      scheduledStartTime,
      scheduledEndTime,
      maxParticipants,
      chatEnabled,
      qaEnabled,
      pollingEnabled,
    } = body;

    // Validate required fields
    if (!courseId || !title || !scheduledStartTime || !scheduledEndTime) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, title, scheduledStartTime, scheduledEndTime' },
        { status: 400 }
      );
    }

    // Validate time range
    const startTime = new Date(scheduledStartTime);
    const endTime = new Date(scheduledEndTime);
    
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    if (startTime < new Date()) {
      return NextResponse.json(
        { error: 'Start time must be in the future' },
        { status: 400 }
      );
    }

    const session = await liveSessionService.createLiveSession(decoded.userId, {
      courseId,
      title,
      description,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      maxParticipants,
      chatEnabled,
      qaEnabled,
      pollingEnabled,
    });

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error creating live session:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId parameter is required' },
        { status: 400 }
      );
    }

    const sessions = await liveSessionService.getSessionsForCourse(courseId);

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    
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
