import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // For JWT-based auth, logout is primarily handled client-side
    // But we can add server-side token blacklisting if needed
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      // TODO: Add token to blacklist if implementing server-side token invalidation
      // For now, we'll just return success as client will clear the token
      console.log('User logged out, token:', token.substring(0, 20) + '...');
    }

    // Clear any cookies if using cookie-based sessions
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Logged out successfully' 
      },
      { status: 200 }
    );

    // Clear auth cookies
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return ErrorHandler.handle(error);
  }
}

// Handle GET requests as well for flexibility
export async function GET(request: NextRequest) {
  return POST(request);
}