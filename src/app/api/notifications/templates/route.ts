import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications';
import { verifyToken } from '@/lib/auth';

// GET /api/notifications/templates - Get notification templates (admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['admin', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // This would need to be implemented in NotificationService
    // For now, return empty array
    return NextResponse.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/templates - Create notification template (admin only)
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
    const { name, description, subject_template, body_template, channels, variables } = body;

    if (!name || !body_template || !channels || !Array.isArray(channels)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, body_template, channels' },
        { status: 400 }
      );
    }

    const templateId = await NotificationService.createTemplate({
      name,
      description,
      subject_template,
      body_template,
      channels,
      variables: variables || [],
      is_active: true
    });

    if (!templateId) {
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: templateId },
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Error creating notification template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}