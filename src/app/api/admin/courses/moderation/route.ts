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

    // Get courses pending moderation
    const courses = await adminService.getCoursesForModeration();

    return NextResponse.json({
      success: true,
      data: courses
    });

  } catch (error) {
    console.error('Error fetching courses for moderation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch courses for moderation',
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
    const { courseId, decision, reviewNotes, qualityScore } = body;

    if (!courseId || !decision) {
      return NextResponse.json(
        { success: false, error: 'Course ID and decision are required' },
        { status: 400 }
      );
    }

    if (!['published', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'Decision must be published or rejected' },
        { status: 400 }
      );
    }

    if (qualityScore && (qualityScore < 1 || qualityScore > 10)) {
      return NextResponse.json(
        { success: false, error: 'Quality score must be between 1 and 10' },
        { status: 400 }
      );
    }

    await adminService.moderateCourse(
      courseId,
      decision,
      authResult.user.id,
      reviewNotes,
      qualityScore
    );

    return NextResponse.json({
      success: true,
      message: `Course ${decision} successfully`
    });

  } catch (error) {
    console.error('Error moderating course:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to moderate course',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}