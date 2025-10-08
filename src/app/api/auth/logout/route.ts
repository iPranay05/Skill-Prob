import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';
import { AuthMiddleware } from '@/middleware/auth';
import { ErrorHandler } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authResult = await AuthMiddleware.authenticate(request);
    
    if ('error' in authResult) {
      return ErrorHandler.success(
        { loggedOut: true },
        'Logged out successfully'
      );
    }

    const { user } = authResult;

    // Revoke refresh token
    await AuthService.revokeRefreshToken(user.userId);

    return ErrorHandler.success(
      { loggedOut: true },
      'Logged out successfully'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
