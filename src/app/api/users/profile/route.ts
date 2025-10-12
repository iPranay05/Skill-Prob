import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Profile API called');
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: { message: 'Authorization token required' } },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Decode JWT token to get user ID
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if token is expired
      if (payload.exp * 1000 < Date.now()) {
        return NextResponse.json(
          { error: { message: 'Token expired' } },
          { status: 401 }
        );
      }
      
      userId = payload.userId;
      console.log('👤 User ID from token:', userId);
    } catch (error) {
      return NextResponse.json(
        { error: { message: 'Invalid token' } },
        { status: 401 }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, phone, profile, verification')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.log('❌ User not found:', userError);
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    console.log('✅ User profile retrieved successfully');

    // Return user profile
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile: user.profile,
        isVerified: user.verification?.emailVerified || false
      }
    });

  } catch (error) {
    console.error('❌ Profile API error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}