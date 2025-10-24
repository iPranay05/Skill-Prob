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

    // Fetch feature flags
    const { data: features, error: featureError } = await supabaseAdmin
      .from('feature_flags')
      .select('*')
      .order('name', { ascending: true });

    if (featureError) {
      console.error('Error fetching feature flags:', featureError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch feature flags' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: features || []
    });

  } catch (error) {
    console.error('Feature flags fetch error:', error);
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

    const { flagId, enabled, rolloutPercentage } = await request.json();

    if (!flagId) {
      return NextResponse.json(
        { success: false, error: 'Flag ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: authResult.user.userId
    };

    if (enabled !== undefined) {
      updateData.enabled = enabled;
    }

    if (rolloutPercentage !== undefined) {
      updateData.rollout_percentage = rolloutPercentage;
    }

    // Update feature flag
    const { data, error } = await supabaseAdmin
      .from('feature_flags')
      .update(updateData)
      .eq('id', flagId)
      .select()
      .single();

    if (error) {
      console.error('Error updating feature flag:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update feature flag' },
        { status: 500 }
      );
    }

    // Log the feature flag change
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: authResult.user.userId,
          user_email: authResult.user.email,
          user_role: authResult.user.role,
          action: 'feature_flag_updated',
          resource: 'feature_flags',
          resource_id: flagId,
          details: {
            flagName: data.name,
            enabled: enabled,
            rolloutPercentage: rolloutPercentage
          },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
    } catch (auditError) {
      console.error('Failed to log feature flag change:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Feature flag update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}