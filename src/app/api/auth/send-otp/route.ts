import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { ErrorHandler, ValidationError, NotFoundError } from '@/lib/errors';
import { User } from '@/models/User';
import OTPService from '@/lib/otpService';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, phone, type, purpose = 'registration' } = body;

    // Validate required fields
    if (!type || !['email', 'phone'].includes(type)) {
      throw new ValidationError('Valid type (email or phone) is required');
    }

    if (type === 'email' && !email) {
      throw new ValidationError('Email is required for email OTP');
    }

    if (type === 'phone' && !phone) {
      throw new ValidationError('Phone number is required for SMS OTP');
    }

    // Find user by email or phone
    let user;
    if (type === 'email') {
      user = await User.findByEmail(email);
    } else {
      user = await User.findByPhone(phone);
    }

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Send OTP
    const result = await OTPService.sendOTP({
      userId: user.id!,
      email: type === 'email' ? email : undefined,
      phone: type === 'phone' ? phone : undefined,
      type,
      purpose,
    });

    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return ErrorHandler.success(
      {
        otpId: result.otpId,
        type,
        expiresIn: 10, // minutes
      },
      result.message
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, phone, type, purpose = 'registration' } = body;

    // Validate required fields
    if (!type || !['email', 'phone'].includes(type)) {
      throw new ValidationError('Valid type (email or phone) is required');
    }

    // Find user
    let user;
    if (type === 'email' && email) {
      user = await User.findByEmail(email);
    } else if (type === 'phone' && phone) {
      user = await User.findByPhone(phone);
    }

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Resend OTP
    const result = await OTPService.resendOTP({
      userId: user.id!,
      email: type === 'email' ? email : undefined,
      phone: type === 'phone' ? phone : undefined,
      type,
      purpose,
    });

    if (!result.success) {
      throw new ValidationError(result.message);
    }

    return ErrorHandler.success(
      {
        otpId: result.otpId,
        type,
        expiresIn: 10, // minutes
      },
      result.message
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}