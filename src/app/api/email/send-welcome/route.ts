import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
import { ErrorHandler, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to_email, to_name, login_url } = body;

    // Validate required fields
    if (!to_email || !to_name || !login_url) {
      throw new ValidationError('Missing required fields: to_email, to_name, login_url');
    }

    // Send welcome email
    const success = await emailService.sendWelcomeEmail({
      to_email,
      to_name,
      login_url,
    });

    if (!success) {
      throw new Error('Failed to send welcome email');
    }

    return ErrorHandler.success(
      { success: true },
      'Welcome email sent successfully'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}