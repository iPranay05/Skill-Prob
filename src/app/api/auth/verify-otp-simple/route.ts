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

    if (!email) {
      throw new ValidationError('Email is required');
    }

    if (!emailOTP) {
      throw new ValidationError('Email OTP is required');
    }

    // Find the user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    console.log('Found user:', user.id);

    // Get the most recent OTP record for this user
    const { data: allOtps, error: otpError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('user_id', user.id!)
      .eq('type', 'email')
      .order('created_at', { ascending: false });

    console.log('All OTP records:', allOtps);
    console.log('OTP query error:', otpError);

    if (otpError) {
      console.error('Database error:', otpError);
      throw new Error('Database error occurred');
    }

    if (!allOtps || allOtps.length === 0) {
      throw new ValidationError('No OTP found. Please request a new verification code.');
    }

    // Get the most recent unverified OTP
    const emailOtpRecord = allOtps.find(otp =>
      !otp.verified &&
      new Date(otp.expires_at) > new Date()
    );

    console.log('Found email OTP record:', emailOtpRecord);

    if (!emailOtpRecord) {
      // Check if there are any OTPs at all
      const anyOtp = allOtps[0];
      if (anyOtp) {
        if (anyOtp.verified) {
          throw new ValidationError('This OTP has already been used. Please request a new one.');
        }
        if (new Date(anyOtp.expires_at) <= new Date()) {
          throw new ValidationError('OTP has expired. Please request a new verification code.');
        }
      }
      throw new ValidationError('No valid OTP found. Please request a new verification code.');
    }

    // Check if the provided OTP matches
    if (emailOtpRecord.code !== emailOTP) {
      throw new ValidationError('Invalid OTP code. Please check and try again.');
    }

    // Mark as verified and update user
    // First try with verified_at column, fallback to just verified if column doesn't exist
    let updateData: any = {
      verified: true,
      verified_at: new Date().toISOString()
    };

    let { error: updateError } = await supabaseAdmin
      .from('otp_verifications')
      .update(updateData)
      .eq('id', emailOtpRecord.id);

    // If error mentions verified_at column, retry without it
    if (updateError && updateError.message?.includes('verified_at')) {
      console.log('verified_at column not found, retrying without it');
      updateData = { verified: true };
      const { error: retryError } = await supabaseAdmin
        .from('otp_verifications')
        .update(updateData)
        .eq('id', emailOtpRecord.id);
      updateError = retryError;
    }

    if (updateError) {
      console.error('Error updating OTP record:', updateError);
      throw new Error('Failed to update verification status');
    }

    // Update user verification status
    await UserModel.updateVerification(user.id!, 'email', true);

    // Handle phone OTP if provided
    let phoneVerified = false;
    if (phoneOTP && user.phone) {
      const { data: phoneOtps } = await supabaseAdmin
        .from('otp_verifications')
        .select('*')
        .eq('user_id', user.id!)
        .eq('type', 'phone')
        .order('created_at', { ascending: false });

      const phoneOtpRecord = phoneOtps?.find(otp =>
        otp.code === phoneOTP &&
        !otp.verified &&
        new Date(otp.expires_at) > new Date()
      );

      if (phoneOtpRecord) {
        const phoneUpdateData: any = {
          verified: true
        };

        // Add verified_at if the column exists
        try {
          phoneUpdateData.verified_at = new Date().toISOString();
        } catch (error) {
          console.log('verified_at column not available for phone OTP, skipping timestamp');
        }

        await supabaseAdmin
          .from('otp_verifications')
          .update(phoneUpdateData)
          .eq('id', phoneOtpRecord.id);

        await UserModel.updateVerification(user.id!, 'phone', true);
        phoneVerified = true;
      }
    }

    // Send welcome email
    try {
      await NotificationService.sendWelcomeEmail(user.email, user.profile.firstName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if email sending fails
    }

    return ErrorHandler.success(
      {
        verified: true,
        emailVerified: true,
        phoneVerified,
        fullyVerified: true,
        message: 'Account verified successfully!'
      },
      'Verification successful'
    );

  } catch (error) {
    console.error('OTP verification error:', error);
    return ErrorHandler.handle(error);
  }
}
