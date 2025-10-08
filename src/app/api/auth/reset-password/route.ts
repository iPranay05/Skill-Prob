import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AuthService } from '@/lib/auth';
import { ErrorHandler, ValidationError, NotFoundError, validateRequired, validatePassword } from '@/lib/errors';
import { UserModel } from '@/models/User';
import { PasswordResetModel } from '@/models/PasswordReset';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { token, newPassword } = body;

    // Validate required fields
    validateRequired(body, ['token', 'newPassword']);

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new ValidationError('Password does not meet requirements', {
        errors: passwordValidation.errors
      });
    }

    // Find the password reset record
    const passwordReset = await PasswordResetModel.findByToken(token);

    if (!passwordReset) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Find the user
    const user = await UserModel.findById(passwordReset.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Hash the new password
    const hashedPassword = await AuthService.hashPassword(newPassword);

    // Update user password
    await UserModel.update(user.id!, { password: hashedPassword });

    // Mark the reset token as used
    await PasswordResetModel.markAsUsed(passwordReset.id!);

    // Revoke all existing refresh tokens for security
    await AuthService.revokeRefreshToken(user.id!);

    return ErrorHandler.success(
      { reset: true },
      'Password reset successfully. Please log in with your new password.'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
