import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';
import { ErrorHandler, ValidationError, validateRequired } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // Validate required fields
    validateRequired(body, ['refreshToken']);

    // Refresh the access token
    const newTokens = await AuthService.refreshAccessToken(refreshToken);

    return ErrorHandler.success(
      { tokens: newTokens },
      'Tokens refreshed successfully'
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
