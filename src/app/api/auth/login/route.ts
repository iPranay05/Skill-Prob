import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AuthService } from '@/lib/auth';
import { ErrorHandler, ValidationError, AuthenticationError, validateRequired, validateEmail } from '@/lib/errors';
import { UserModel } from '@/models/User';
import { SecurityMiddleware, SecurityPresets } from '@/lib/security/middleware';
import { AuditService } from '@/lib/security/auditService';
import { InputValidator } from '@/lib/security/inputValidation';

export async function POST(request: NextRequest) {
  return SecurityMiddleware.apply(
    request,
    SecurityPresets.AUTHENTICATION,
    async (req, context) => {
      try {
        await connectToDatabase();

        const body = await request.json();
        const { email, password } = body;

        // Validate input using security validator
        const validation = InputValidator.validateApiRequest(
          InputValidator.userRegistrationSchema.pick({ email: true }),
          { email }
        );

        if (!validation.valid) {
          throw new ValidationError(validation.errors?.join(', ') || 'Invalid input');
        }

        // Validate required fields
        validateRequired(body, ['email', 'password']);

        // Validate email format
        if (!validateEmail(email)) {
          throw new ValidationError('Invalid email format');
        }

        // Find user by email
        const user = await UserModel.findByEmail(email);
        if (!user) {
          // Log failed authentication attempt
          await AuditService.logAuthentication(
            'login',
            undefined,
            email,
            false,
            { reason: 'user_not_found', email },
            context.ipAddress,
            context.userAgent,
            'Invalid email or password'
          );
          throw new AuthenticationError('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await AuthService.comparePassword(password, user.password);
        if (!isPasswordValid) {
          // Log failed authentication attempt
          await AuditService.logAuthentication(
            'login',
            user.id,
            user.email,
            false,
            { reason: 'invalid_password', userId: user.id },
            context.ipAddress,
            context.userAgent,
            'Invalid email or password'
          );
          throw new AuthenticationError('Invalid email or password');
        }

        // Check if email is verified
        if (!user.verification.emailVerified) {
          await AuditService.logAuthentication(
            'login',
            user.id,
            user.email,
            false,
            { reason: 'email_not_verified', userId: user.id },
            context.ipAddress,
            context.userAgent,
            'Email not verified'
          );
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

        // Log successful authentication
        await AuditService.logAuthentication(
          'login',
          user.id,
          user.email,
          true,
          { 
            userId: user.id,
            role: user.role,
            lastLogin: new Date().toISOString()
          },
          context.ipAddress,
          context.userAgent
        );

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
  );
}
