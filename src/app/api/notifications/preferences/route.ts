import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications';
import { verifyAuth } from '@/lib/auth';

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await NotificationService.getUserPreferences(authResult.user.userId);

    return NextResponse.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email_enabled,
      sms_enabled,
      push_enabled,
      in_app_enabled,
      preferences,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      timezone
    } = body;

    const success = await NotificationService.updateUserPreferences(authResult.user.userId, {
      email_enabled,
      sms_enabled,
      push_enabled,
      in_app_enabled,
      preferences,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      timezone
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}