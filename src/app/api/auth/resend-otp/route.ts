import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { NotificationService } from '@/lib/notifications';
import { ErrorHandler, ValidationError, NotFoundError, validateRequired } from '@/lib/errors';
import { UserModel } from '@/models/User';
import { OTPVerificationModel } from '@/models/OTPVerification';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, type } = body;

    // Validate required fields
    validateRequired(body, ['email', 'type']);

    // Validate type
    if (!['email', 'phone'].includes(type)) {
      throw new ValidationError('Invalid verification type. Must be "email" or "phone"');
    }

    // Find the user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if already verified
    if (type === 'email' && user.verification.emailVerified) {
      throw new ValidationError('Email is already verified');
    }
    if (type === 'phone' && user.verification.phoneVerified) {
      throw new ValidationError('Phone is already verified');
    }

    // Check if phone exists for phone verification
    if (type === 'phone' && !user.phone) {
      throw new ValidationError('Phone number not found for SMS verification');
    }

    // Delete existing unverified OTP records for this user and type
    await OTPVerificationModel.deleteUnverifiedByUserAndType(user.id!, type);

    // Generate new OTP
    const newOTP = AuthService.generateOTP();
    
    // Create new OTP record
    await OTPVerificationModel.create({
      userId: user.id!,
      type,
      code: newOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      verified: false
    });

    // Send OTP based on type
    if (type === 'email') {
      await NotificationService.sendOTPEmail(user.email, newOTP, user.profile.firstName);
      return ErrorHandler.success(
        { sent: true, type },
        `New email OTP sent successfully`
      );
    } else if (type === 'phone') {
      await NotificationService.sendOTPSMS(user.phone!, newOTP);
      return ErrorHandler.success(
        { sent: true, type },
        `New SMS OTP sent successfully`
      );
    }

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
