import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../lib/auth';

/**
 * POST /api/auth/refresh - Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Refresh the access token
    const newTokens = await AuthService.refreshAccessToken(refreshToken);

    return NextResponse.json({
      success: true,
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);

    // Check if it's a specific auth error
    if (error instanceof Error && error.message.includes('Invalid or expired refresh token')) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}