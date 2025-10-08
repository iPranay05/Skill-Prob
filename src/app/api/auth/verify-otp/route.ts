import { NextRequest } from 'next/server';
import { connectToDatabase, supabaseAdmin } from '@/lib/database';
import { NotificationService } from '@/lib/notifications';
import { ErrorHandler, ValidationError, NotFoundError, validateRequired } from '@/lib/errors';
import { UserModel } from '@/models/User';
import { OTPVerificationModel } from '@/models/OTPVerification';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    console.log('Received OTP verification data:', body);
    const { email, emailOTP, phoneOTP } = body;

    // Validate required fields
    if (!email) {
      throw new ValidationError('Email is required');
    }
    if (!emailOTP) {
      throw new ValidationError('Email OTP is required');
    }

    // Find the user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User');
    }

    let emailVerified = false;
    let phoneVerified = false;

    // Verify email OTP
    if (emailOTP) {
      console.log(`Looking for email OTP: ${emailOTP} for user: ${user.id}`);

      // Debug: Let's check what OTP records exist for this user
      try {
        const { data: allOtps, error: otpError } = await supabaseAdmin
          .from('otp_verifications')
          .select('*')
          .eq('user_id', user.id!);
        console.log('All OTP records for user:', allOtps);
        console.log('OTP query error:', otpError);
      } catch (debugError) {
        console.log('Debug query failed:', debugError);
      }

      const emailOtpRecord = await OTPVerificationModel.findValidOTP(user.id!, 'email', emailOTP);
      console.log('Found email OTP record:', emailOtpRecord);
      if (!emailOtpRecord) {
        throw new ValidationError('Invalid or expired email OTP code');
      }

      // Mark email OTP as verified
      await OTPVerificationModel.markAsVerified(emailOtpRecord.id!);
      await UserModel.updateVerification(user.id!, 'email', true);
      emailVerified = true;
    }

    // Verify phone OTP if provided
    if (phoneOTP && user.phone) {
      console.log(`Looking for phone OTP: ${phoneOTP} for user: ${user.id}`);
      const phoneOtpRecord = await OTPVerificationModel.findValidOTP(user.id!, 'phone', phoneOTP);
      console.log('Found phone OTP record:', phoneOtpRecord);
      if (!phoneOtpRecord) {
        throw new ValidationError('Invalid or expired phone OTP code');
      }

      // Mark phone OTP as verified
      await OTPVerificationModel.markAsVerified(phoneOtpRecord.id!);
      await UserModel.updateVerification(user.id!, 'phone', true);
      phoneVerified = true;
    }

    // Check if user is fully verified
    const updatedUser = await UserModel.findById(user.id!);
    const isFullyVerified = updatedUser!.verification.emailVerified &&
      (!updatedUser!.phone || updatedUser!.verification.phoneVerified);

    // Send welcome email if fully verified
    if (isFullyVerified) {
      await NotificationService.sendWelcomeEmail(user.email, user.profile.firstName);
    }

    return ErrorHandler.success(
      {
        verified: true,
        emailVerified,
        phoneVerified,
        fullyVerified: isFullyVerified
      },
      'Verification successful'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}


