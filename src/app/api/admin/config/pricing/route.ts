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

    // Get pricing configuration
    const pricingConfig = await systemConfigService.getPricingConfig();

    return NextResponse.json({
      success: true,
      data: pricingConfig
    });

  } catch (error) {
    console.error('Error fetching pricing config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pricing configuration',
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

    // Only super admins can update pricing configuration
    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate pricing configuration structure
    const validFields = [
      'defaultCurrency', 'taxRates', 'commissionRates', 
      'refundPolicy', 'discountLimits'
    ];
    
    const invalidFields = Object.keys(body).filter(key => !validFields.includes(key));
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid fields: ${invalidFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate commission rates sum to 100%
    if (body.commissionRates) {
      const { mentor, ambassador, platform } = body.commissionRates;
      if (mentor + ambassador + platform !== 100) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Commission rates must sum to 100%' 
          },
          { status: 400 }
        );
      }
    }

    await systemConfigService.updatePricingConfig(body, authResult.user.userId);

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating pricing config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update pricing configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}