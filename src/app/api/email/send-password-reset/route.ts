import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
import { ErrorHandler, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, resetToken } = body;

    // Validate required fields
    if (!email || !name || !resetToken) {
      throw new ValidationError('Missing required fields: email, name, resetToken');
    }

    // Send password reset email
    const success = await emailService.sendPasswordResetEmail(email, name, resetToken);

    if (!success) {
      throw new Error('Failed to send password reset email');
    }

    return ErrorHandler.success(
      { success: true },
      'Password reset email sent successfully'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}