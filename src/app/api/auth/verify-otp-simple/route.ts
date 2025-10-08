import { NextRequest } from 'next/server';
import { connectToDatabase, supabaseAdmin } from '@/lib/database';
import { NotificationService } from '@/lib/notifications';
import { ErrorHandler, ValidationError, NotFoundError } from '@/lib/errors';
import { UserModel } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    console.log('Simple OTP verification - received data:', body);
    const { email, emailOTP, phoneOTP } = body;

    if (!email || !emailOTP) {
      throw new ValidationError('Email and email OTP are required');
    }

    // Find the user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User');
    }

    console.log('Found user:', user.id);

    // For now, let's just check if ANY OTP record exists for this user
    const { data: allOtps, error: otpError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('user_id', user.id!);

    console.log('All OTP records:', allOtps);
    console.log('OTP query error:', otpError);

    if (!allOtps || allOtps.length === 0) {
      throw new ValidationError('No OTP records found for this user');
    }

    // Find email OTP record (any valid one for now)
    const emailOtpRecord = allOtps.find(otp => 
      otp.type === 'email' && 
      otp.code === emailOTP && 
      !otp.verified &&
      new Date(otp.expires_at) > new Date()
    );

    console.log('Found email OTP record:', emailOtpRecord);

    if (!emailOtpRecord) {
      // Let's see what OTP records we have
      console.log('Available email OTPs:', allOtps.filter(otp => otp.type === 'email'));
      throw new ValidationError('Invalid or expired email OTP code');
    }

    // Mark as verified and update user
    await supabaseAdmin
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', emailOtpRecord.id);

    await UserModel.updateVerification(user.id!, 'email', true);

    // Handle phone OTP if provided
    let phoneVerified = false;
    if (phoneOTP && user.phone) {
      const phoneOtpRecord = allOtps.find(otp => 
        otp.type === 'phone' && 
        otp.code === phoneOTP && 
        !otp.verified &&
        new Date(otp.expires_at) > new Date()
      );

      if (phoneOtpRecord) {
        await supabaseAdmin
          .from('otp_verifications')
          .update({ verified: true })
          .eq('id', phoneOtpRecord.id);

        await UserModel.updateVerification(user.id!, 'phone', true);
        phoneVerified = true;
      }
    }

    // Send welcome email
    await NotificationService.sendWelcomeEmail(user.email, user.profile.firstName);

    return ErrorHandler.success(
      {
        verified: true,
        emailVerified: true,
        phoneVerified,
        fullyVerified: true
      },
      'Verification successful'
    );

  } catch (error) {
    console.error('OTP verification error:', error);
    return ErrorHandler.handle(error);
  }
}
