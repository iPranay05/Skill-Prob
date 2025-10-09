import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/adminService';
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

    // Get pending mentor applications
    const applications = await adminService.getPendingMentorApplications();

    return NextResponse.json({
      success: true,
      data: applications
    });

  } catch (error) {
    console.error('Error fetching mentor applications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch mentor applications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { applicationId, decision, reviewNotes } = body;

    if (!applicationId || !decision) {
      return NextResponse.json(
        { success: false, error: 'Application ID and decision are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'Decision must be approved or rejected' },
        { status: 400 }
      );
    }

    await adminService.processMentorApplication(
      applicationId,
      decision,
      authResult.user.id,
      reviewNotes
    );

    return NextResponse.json({
      success: true,
      message: `Mentor application ${decision} successfully`
    });

  } catch (error) {
    console.error('Error processing mentor application:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process mentor application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}