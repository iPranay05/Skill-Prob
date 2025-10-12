import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { APIError } from '../../../../../lib/errors';
import { UserRole } from '../../../../../types/user';
import { supabaseAdmin } from '../../../../../lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== UserRole.ADMIN && authResult.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const { courseId } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!['approve', 'reject', 'archive', 'publish'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be approve, reject, archive, or publish.' },
        { status: 400 }
      );
    }

    // Check if course exists
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, mentor_id, status')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    let newStatus = '';
    let auditAction = '';

    switch (action) {
      case 'approve':
        if (course.status !== 'pending_review') {
          return NextResponse.json(
            { success: false, error: 'Course is not pending review' },
            { status: 400 }
          );
        }
        newStatus = 'published';
        auditAction = 'course_approved';
        break;
      case 'reject':
        if (course.status !== 'pending_review') {
          return NextResponse.json(
            { success: false, error: 'Course is not pending review' },
            { status: 400 }
          );
        }
        newStatus = 'draft';
        auditAction = 'course_rejected';
        break;
      case 'archive':
        if (course.status !== 'published') {
          return NextResponse.json(
            { success: false, error: 'Only published courses can be archived' },
            { status: 400 }
          );
        }
        newStatus = 'archived';
        auditAction = 'course_archived';
        break;
      case 'publish':
        if (course.status !== 'draft') {
          return NextResponse.json(
            { success: false, error: 'Only draft courses can be published' },
            { status: 400 }
          );
        }
        newStatus = 'published';
        auditAction = 'course_published';
        break;
    }

    // Update course status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Add review information for approve/reject actions
    if (action === 'approve' || action === 'reject') {
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = authResult.user.userId;
      if (action === 'reject' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('courses')
      .update(updateData)
      .eq('id', courseId);

    if (updateError) {
      throw new APIError(`Failed to ${action} course: ${updateError.message}`, 500);
    }

    // Create audit log
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: authResult.user.userId,
          action: auditAction,
          resource_type: 'course',
          resource_id: courseId,
          details: {
            courseTitle: course.title,
            mentorId: course.mentor_id,
            action: action,
            rejectionReason: rejectionReason || null,
            timestamp: new Date().toISOString()
          }
        });
    } catch (auditError) {
      console.log('Audit log failed (non-critical):', auditError);
    }

    // Send notification to mentor (optional)
    try {
      let notificationMessage = '';
      switch (action) {
        case 'approve':
          notificationMessage = `Your course "${course.title}" has been approved and is now published.`;
          break;
        case 'reject':
          notificationMessage = `Your course "${course.title}" has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`;
          break;
        case 'archive':
          notificationMessage = `Your course "${course.title}" has been archived.`;
          break;
      }

      if (notificationMessage) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: course.mentor_id,
            type: 'course_status_update',
            title: `Course ${action}d`,
            message: notificationMessage,
            created_at: new Date().toISOString()
          });
      }
    } catch (notificationError) {
      console.log('Notification failed (non-critical):', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: {
        courseId,
        action,
        status: newStatus,
        reviewedAt: updateData.reviewed_at,
        message: `Course ${action}d successfully`
      }
    });

  } catch (error) {
    console.error('Course action error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== UserRole.ADMIN && authResult.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const { courseId } = await params;

    // Get course details with mentor information
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        users!courses_mentor_id_fkey(
          id,
          email,
          profile
        )
      `)
      .eq('id', courseId)
      .single();

    if (error || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get enrollment count
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('id, student_id, created_at')
      .eq('course_id', courseId);

    // Get course reviews
    const { data: reviews } = await supabaseAdmin
      .from('course_reviews')
      .select('id, rating, comment, created_at')
      .eq('course_id', courseId);

    // Get course content count
    const { data: content } = await supabaseAdmin
      .from('course_content')
      .select('id, type')
      .eq('course_id', courseId);

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        mentorName: course.users?.profile?.firstName && course.users?.profile?.lastName
          ? `${course.users.profile.firstName} ${course.users.profile.lastName}`
          : course.users?.profile?.firstName || 'Unknown Mentor',
        mentorEmail: course.users?.email,
        enrollmentCount: enrollments?.length || 0,
        enrollments: enrollments || [],
        reviews: reviews || [],
        contentCount: content?.length || 0,
        contentTypes: content?.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      }
    });

  } catch (error) {
    console.error('Course details fetch error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}