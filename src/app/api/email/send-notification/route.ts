import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
import { ErrorHandler, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to_email, to_name, subject, message, action_url, action_text } = body;

    // Validate required fields
    if (!to_email || !to_name || !subject || !message) {
      throw new ValidationError('Missing required fields: to_email, to_name, subject, message');
    }

    // Send notification email
    const success = await emailService.sendNotificationEmail({
      to_email,
      to_name,
      subject,
      message,
      action_url,
      action_text,
    });

    if (!success) {
      throw new Error('Failed to send notification email');
    }

    return ErrorHandler.success(
      { success: true },
      'Notification email sent successfully'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}