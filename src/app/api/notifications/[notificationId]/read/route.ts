import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications';
import { verifyAuth } from '@/lib/auth';

// PUT /api/notifications/[notificationId]/read - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await params;

    const success = await NotificationService.markNotificationAsRead(
      notificationId,
      authResult.user.userId
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}