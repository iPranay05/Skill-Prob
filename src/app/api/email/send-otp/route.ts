import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
import { ErrorHandler, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to_email, to_name, otp_code, expires_in } = body;

    // Validate required fields
    if (!to_email || !to_name || !otp_code || !expires_in) {
      throw new ValidationError('Missing required fields: to_email, to_name, otp_code, expires_in');
    }

    // Send OTP email
    const success = await emailService.sendOTPEmail({
      to_email,
      to_name,
      otp_code,
      expires_in,
    });

    if (!success) {
      throw new Error('Failed to send OTP email');
    }

    return ErrorHandler.success(
      { success: true },
      'OTP email sent successfully'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}