import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { ErrorHandler, ValidationError, NotFoundError } from '@/lib/errors';
import { User } from '@/models/User';
import OTPService from '@/lib/otpService';
import { emailService } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    console.log('Received OTP verification data:', body);
    const { email, phone, code, type } = body;

    // Validate required fields
    if (!code) {
      throw new ValidationError('OTP code is required');
    }

    if (!type || !['email', 'phone'].includes(type)) {
      throw new ValidationError('Valid type (email or phone) is required');
    }

    // Find user by email or phone
    let user;
    if (type === 'email' && email) {
      user = await User.findByEmail(email);
    } else if (type === 'phone' && phone) {
      user = await User.findByPhone(phone);
    } else {
      throw new ValidationError(`${type === 'email' ? 'Email' : 'Phone'} is required for ${type} verification`);
    }

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify OTP using the new service
    const verificationResult = await OTPService.verifyOTP({
      userId: user.id!,
      code,
      type,
    });

    if (!verificationResult.success) {
      throw new ValidationError(verificationResult.message);
    }

    // Update user verification status
    if (type === 'email') {
      await User.updateVerification(user.id!, 'email', true);
    } else if (type === 'phone') {
      await User.updateVerification(user.id!, 'phone', true);
    }

    // Check if user is fully verified
    const updatedUser = await User.findById(user.id!);
    const isFullyVerified = updatedUser!.verification.emailVerified &&
      (!updatedUser!.phone || updatedUser!.verification.phoneVerified);

    // Send welcome email if fully verified and this was email verification
    if (isFullyVerified && type === 'email') {
      const userName = updatedUser!.profile?.firstName || updatedUser!.email.split('@')[0];
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`;
      
      await emailService.sendWelcomeEmail({
        to_email: updatedUser!.email,
        to_name: userName,
        login_url: loginUrl,
      });
    }

    return ErrorHandler.success(
      {
        verified: true,
        type,
        fullyVerified: isFullyVerified,
        otpRecord: verificationResult.otpRecord,
      },
      'OTP verified successfully'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}


