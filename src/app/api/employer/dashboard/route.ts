import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Check if user is employer or admin
    if (!['employer', 'admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only employers and admins can access employer dashboard'
          }
        },
        { status: 403 }
      );
    }

    // Get employer statistics
    const stats = await JobService.getEmployerStats(authResult.user.userId);

    // Get recent job postings
    const recentJobs = await JobService.getJobPostingsByEmployer(authResult.user.userId);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentJobs: recentJobs.slice(0, 5) // Return only 5 most recent
      }
    });
  } catch (error) {
    console.error('Error getting employer dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DASHBOARD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get employer dashboard data'
        }
      },
      { status: 500 }
    );
  }
}