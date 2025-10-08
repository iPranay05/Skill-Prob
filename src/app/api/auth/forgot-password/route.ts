import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { NotificationService } from '@/lib/notifications';
import { ErrorHandler, ValidationError, NotFoundError, validateRequired, validateEmail } from '@/lib/errors';
import { UserModel } from '@/models/User';
import { PasswordResetModel } from '@/models/PasswordReset';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email } = body;

    // Validate required fields
    validateRequired(body, ['email']);

    // Validate email format
    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return ErrorHandler.success(
        { sent: true },
        'If an account with this email exists, a password reset link has been sent.'
      );
    }

    // Delete any existing unused password reset tokens for this user
    await PasswordResetModel.deleteUnusedByUserId(user.id!);

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Create password reset record
    await PasswordResetModel.create({
      userId: user.id!,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      used: false
    });

    // Send password reset email
    await NotificationService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.profile.firstName
    );

    return ErrorHandler.success(
      { sent: true },
      'If an account with this email exists, a password reset link has been sent.'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
