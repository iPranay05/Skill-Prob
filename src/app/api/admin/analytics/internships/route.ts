import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analyticsService';
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

    // Get internship metrics
    const internshipMetrics = await analyticsService.getInternshipMetrics();

    return NextResponse.json({
      success: true,
      data: internshipMetrics
    });

  } catch (error) {
    console.error('Error fetching internship analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch internship analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}