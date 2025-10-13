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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    let data;
    if (key) {
      // Get specific configuration
      data = await systemConfigService.getConfig(key);
    } else if (category) {
      // Get configurations by category
      data = await systemConfigService.getConfigsByCategory(category);
    } else {
      // Get all configurations (limited to super admin)
      if (authResult.user.role !== 'super_admin') {
        return NextResponse.json(
          { success: false, error: 'Super admin access required' },
          { status: 403 }
        );
      }
      
      const categories = ['pricing', 'integrations', 'feature_flags', 'general'];
      const allConfigs = await Promise.all(
        categories.map(cat => systemConfigService.getConfigsByCategory(cat))
      );
      
      data = categories.reduce((acc, cat, index) => {
        acc[cat] = allConfigs[index];
        return acc;
      }, {} as any);
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch system configuration',
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

    // Only super admins can update system configurations
    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    await systemConfigService.updateConfig(key, value, authResult.user.userId, description);

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating system config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update system configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}