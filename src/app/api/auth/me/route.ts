import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';

/**
 * GET /api/auth/me - Get current user information
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the token and get user info
    const authResult = await verifyToken(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return user information
    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user.userId,
        email: authResult.user.email,
        role: authResult.user.role
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}