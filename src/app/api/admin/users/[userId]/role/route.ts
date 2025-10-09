import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/adminService';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['student', 'mentor', 'ambassador', 'employer', 'admin'];
    if (authResult.user.role === 'super_admin') {
      validRoles.push('super_admin');
    }

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Prevent non-super-admin from creating super-admin
    if (role === 'super_admin' && authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin can assign super admin role' },
        { status: 403 }
      );
    }

    await adminService.updateUserRole(userId, role, authResult.user.id);

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}