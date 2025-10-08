import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AuthService } from '@/lib/auth';
import { ErrorHandler, ValidationError, AuthenticationError, validateRequired, validateEmail } from '@/lib/errors';
import { UserModel } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    validateRequired(body, ['email', 'password']);

    // Validate email format
    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await AuthService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if email is verified
    if (!user.verification.emailVerified) {
      throw new AuthenticationError('Please verify your email before logging in');
    }

    // Generate tokens
    const tokens = AuthService.generateTokens({
      userId: user.id!,
      email: user.email,
      role: user.role
    });

    // Store refresh token
    await AuthService.storeRefreshToken(user.id!, tokens.refreshToken);

    // Update last login
    await UserModel.update(user.id!, { updatedAt: new Date().toISOString() });

    // Return user data and tokens (without sensitive information)
    const userResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile: user.profile,
      verification: user.verification,
      preferences: user.preferences,
      referralCode: user.referralCode
    };

    return ErrorHandler.success(
      {
        user: userResponse,
        tokens
      },
      'Login successful'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
