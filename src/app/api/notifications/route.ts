import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications';
import { verifyToken } from '@/lib/auth';

// GET /api/notifications - Get user's in-app notifications
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const notifications = await NotificationService.getInAppNotifications(
      decoded.userId,
      limit,
      offset
    );

    const unreadCount = await NotificationService.getUnreadCount(decoded.userId);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        hasMore: notifications.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Send a notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['admin', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { templateName, recipientId, channels, variables, priority, scheduledAt, metadata } = body;

    if (!templateName || !recipientId || !variables) {
      return NextResponse.json(
        { error: 'Missing required fields: templateName, recipientId, variables' },
        { status: 400 }
      );
    }

    const success = await NotificationService.queueNotification({
      templateName,
      recipientId,
      channels,
      variables,
      priority,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      metadata
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to queue notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification queued successfully'
    });
  } catch (error) {
    console.error('Error queueing notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}