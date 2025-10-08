import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AuthMiddleware } from '@/middleware/auth';
import { ErrorHandler, ValidationError, NotFoundError, validateRequired } from '@/lib/errors';
import { UserModel } from '@/models/User';
import { UserRole } from '@/types/user';

interface RouteParams {
  params: {
    userId: string;
  };
}

// Update user role (Admin/Super Admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const authResult = await AuthMiddleware.requireAuth(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { user: authUser } = authResult;
    const { userId } = params;
    const body = await request.json();

    // Validate required fields
    validateRequired(body, ['role']);

    const { role } = body;

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      throw new ValidationError('Invalid role specified');
    }

    // Find the target user
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      throw new NotFoundError('User');
    }

    // Permission checks
    if (authUser.role === UserRole.ADMIN) {
      // Admins cannot assign SUPER_ADMIN role or modify other admins/super admins
      if (role === UserRole.SUPER_ADMIN) {
        throw new ValidationError('Insufficient permissions to assign Super Admin role');
      }
      
      if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(targetUser.role)) {
        throw new ValidationError('Insufficient permissions to modify admin users');
      }
    }

    // Prevent users from modifying their own role
    if (authUser.userId === userId) {
      throw new ValidationError('Cannot modify your own role');
    }

    // Update the role
    const updatedUser = await UserModel.update(userId, { role });

    // Remove password from response
    const { password, ...userResponse } = updatedUser;

    return ErrorHandler.success(
      userResponse,
      `User role updated to ${role} successfully`
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}