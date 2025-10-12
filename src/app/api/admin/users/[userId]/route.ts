import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { APIError } from '../../../../../lib/errors';
import { UserRole } from '../../../../../types/user';
import { supabaseAdmin } from '../../../../../lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    const { userId } = params;
    const body = await request.json();
    const { action } = body;

    if (!['suspend', 'activate', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be suspend, activate, or delete.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admins from modifying other admins (unless super admin)
    if ((user.role === 'admin' || user.role === 'super_admin') && authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify admin users' },
        { status: 403 }
      );
    }

    // Prevent self-modification
    if (user.id === authResult.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify your own account' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let auditAction = '';

    switch (action) {
      case 'suspend':
        updateData = { status: 'suspended', updated_at: new Date().toISOString() };
        auditAction = 'user_suspended';
        break;
      case 'activate':
        updateData = { status: 'active', updated_at: new Date().toISOString() };
        auditAction = 'user_activated';
        break;
      case 'delete':
        // For safety, we'll mark as deleted rather than actually deleting
        updateData = { status: 'deleted', updated_at: new Date().toISOString() };
        auditAction = 'user_deleted';
        break;
    }

    // Update user status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      throw new APIError(`Failed to ${action} user: ${updateError.message}`, 500);
    }

    // Create audit log
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: authResult.user.userId,
          action: auditAction,
          resource_type: 'user',
          resource_id: userId,
          details: {
            targetUser: user.email,
            action: action,
            timestamp: new Date().toISOString()
          }
        });
    } catch (auditError) {
      console.log('Audit log failed (non-critical):', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        action,
        status: updateData.status,
        message: `User ${action}d successfully`
      }
    });

  } catch (error) {
    console.error('User action error:', error);
    
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
  { params }: { params: { userId: string } }
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

    const { userId } = params;

    // Get user details
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        role,
        profile,
        verification,
        created_at,
        updated_at,
        last_login_at,
        status
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get additional user statistics based on role
    let additionalData: any = {};

    if (user.role === 'mentor') {
      // Get mentor's courses
      const { data: courses } = await supabaseAdmin
        .from('courses')
        .select('id, title, status, created_at')
        .eq('mentor_id', userId);

      additionalData.courses = courses || [];
    }

    if (user.role === 'ambassador') {
      // Get ambassador's referrals
      const { data: referrals } = await supabaseAdmin
        .from('referrals')
        .select('id, status, created_at')
        .eq('ambassador_id', userId);

      additionalData.referrals = referrals || [];
    }

    if (user.role === 'student') {
      // Get student's enrollments
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('id, course_id, created_at, status')
        .eq('student_id', userId);

      additionalData.enrollments = enrollments || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        ...additionalData
      }
    });

  } catch (error) {
    console.error('User details fetch error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}