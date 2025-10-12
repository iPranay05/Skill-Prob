import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';
import { ErrorHandler } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user settings
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('preferences')
      .eq('id', authResult.user.userId)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Return default settings if none exist
    const defaultSettings = {
      notifications: {
        email: true,
        sms: false,
        push: true,
        marketing: false,
        courseUpdates: true,
        liveSessionReminders: true,
        paymentNotifications: true
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        theme: 'light'
      }
    };

    const settings = user?.preferences || defaultSettings;

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    return ErrorHandler.handle(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await request.json();

    // Validate settings structure
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Update user preferences
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        preferences: {
          ...settings,
          updatedAt: new Date().toISOString()
        }
      })
      .eq('id', authResult.user.userId);

    if (error) {
      console.error('Error updating user settings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return ErrorHandler.handle(error);
  }
}