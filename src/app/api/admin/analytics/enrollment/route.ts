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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' | 'year' || 'month';

    // Get enrollment statistics
    const enrollmentStats = await analyticsService.getEnrollmentStats(timeframe);

    return NextResponse.json({
      success: true,
      data: enrollmentStats
    });

  } catch (error) {
    console.error('Error fetching enrollment analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch enrollment analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}