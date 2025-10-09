import { NextRequest, NextResponse } from 'next/server';
import { systemConfigService } from '@/lib/systemConfigService';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and super admin role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admins can access audit logs
    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get audit logs with filters
    const auditLogs = await systemConfigService.getAuditLogs({
      userId,
      resource,
      action,
      startDate,
      endDate,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      data: auditLogs,
      pagination: {
        limit,
        offset,
        hasMore: auditLogs.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch audit logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, resource, resourceId, oldValues, newValues } = body;

    if (!action || !resource) {
      return NextResponse.json(
        { success: false, error: 'Action and resource are required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    await systemConfigService.createAuditLog({
      userId: authResult.user.id,
      action,
      resource,
      resourceId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    });

    return NextResponse.json({
      success: true,
      message: 'Audit log created successfully'
    });

  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create audit log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}