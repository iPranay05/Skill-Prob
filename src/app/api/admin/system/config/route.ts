import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and super admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Super admin role required.' },
        { status: 403 }
      );
    }

    // Fetch system configs
    const { data: configs, error: configError } = await supabaseAdmin
      .from('system_configs')
      .select('*')
      .order('category', { ascending: true });

    if (configError) {
      console.error('Error fetching system configs:', configError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch system configs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: configs || []
    });

  } catch (error) {
    console.error('System config fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication and super admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Super admin role required.' },
        { status: 403 }
      );
    }

    const { configId, value } = await request.json();

    if (!configId || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Config ID and value are required' },
        { status: 400 }
      );
    }

    // Update system config
    const { data, error } = await supabaseAdmin
      .from('system_configs')
      .update({ 
        value: value,
        updated_at: new Date().toISOString(),
        updated_by: authResult.user.userId
      })
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      console.error('Error updating system config:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update system config' },
        { status: 500 }
      );
    }

    // Log the config change
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: authResult.user.userId,
          user_email: authResult.user.email,
          user_role: authResult.user.role,
          action: 'system_config_updated',
          resource: 'system_configs',
          resource_id: configId,
          details: {
            configKey: data.key,
            oldValue: data.value,
            newValue: value
          },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
    } catch (auditError) {
      console.error('Failed to log config change:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('System config update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}