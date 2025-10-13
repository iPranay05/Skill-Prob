import { NextRequest, NextResponse } from 'next/server';
import { systemConfigService } from '@/lib/systemConfigService';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get feature flags
    const featureFlags = await systemConfigService.getFeatureFlags();

    return NextResponse.json({
      success: true,
      data: featureFlags
    });

  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feature flags',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication and super admin role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admins can update feature flags
    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { flagName, enabled, description, rolloutPercentage, targetRoles } = body;

    if (!flagName || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Flag name and enabled status are required' },
        { status: 400 }
      );
    }

    // Validate rollout percentage
    if (rolloutPercentage !== undefined && (rolloutPercentage < 0 || rolloutPercentage > 100)) {
      return NextResponse.json(
        { success: false, error: 'Rollout percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate target roles
    const validRoles = ['student', 'mentor', 'ambassador', 'employer', 'admin', 'super_admin'];
    if (targetRoles && Array.isArray(targetRoles)) {
      const invalidRoles = targetRoles.filter(role => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid roles: ${invalidRoles.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }

    await systemConfigService.updateFeatureFlag(
      flagName, 
      enabled, 
      authResult.user.userId,
      { description, rolloutPercentage, targetRoles }
    );

    return NextResponse.json({
      success: true,
      message: 'Feature flag updated successfully'
    });

  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update feature flag',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and super admin role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admins can create feature flags
    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { flagName } = body;

    if (!flagName) {
      return NextResponse.json(
        { success: false, error: 'Flag name is required' },
        { status: 400 }
      );
    }

    // Check if feature is enabled for the current user
    const isEnabled = await systemConfigService.isFeatureEnabled(flagName, authResult.user.role);

    return NextResponse.json({
      success: true,
      data: { enabled: isEnabled }
    });

  } catch (error) {
    console.error('Error checking feature flag:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check feature flag',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}