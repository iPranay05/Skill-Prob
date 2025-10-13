import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Login API called');
    const body = await request.json();
    const { email, password } = body;
    console.log('📧 Login attempt for email:', email);

    if (!email || !password) {
      return NextResponse.json(
        { error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Get user from database using admin client (for RLS bypass)
    console.log('🔍 Searching for user in database...');
    const { supabaseAdmin } = await import('@/lib/database');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, password, role, phone, profile, verification')
      .eq('email', email.toLowerCase())
      .single();

    console.log('👤 User found:', !!user);
    console.log('❌ User error:', userError);

    if (userError || !user) {
      console.log('❌ User not found or error occurred');
      return NextResponse.json(
        { error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Verify password - check if it's plain text or hashed
    console.log('🔐 Verifying password...');
    console.log('🔑 Stored password length:', user.password?.length);
    console.log('🔑 Input password length:', password?.length);
    console.log('🔑 Input password:', password);
    console.log('🔑 Stored password (first 20 chars):', user.password?.substring(0, 20));

    let isValidPassword = false;

    // First try direct comparison (for plain text passwords)
    if (password === user.password) {
      console.log('✅ Plain text password match');
      isValidPassword = true;
    } else {
      console.log('❌ Plain text password no match, trying bcrypt...');
      // Then try bcrypt comparison (for hashed passwords)
      try {
        console.log('🔐 Using direct bcryptjs.compare...');
        isValidPassword = await bcrypt.compare(password, user.password);
        console.log('🔐 Direct bcryptjs result:', isValidPassword);

        // Also try AuthService for comparison
        console.log('🔐 Also trying AuthService.comparePassword...');
        const authServiceResult = await AuthService.comparePassword(password, user.password);
        console.log('🔐 AuthService result:', authServiceResult);

        // Use the direct bcryptjs result
        isValidPassword = await bcrypt.compare(password, user.password);
      } catch (error) {
        console.log('❌ Bcrypt error:', error);
        console.log('❌ Bcrypt error details:', error instanceof Error ? error.message : 'Unknown error');
        // If bcrypt fails, password might be plain text but doesn't match
        isValidPassword = false;
      }
    }

    if (!isValidPassword) {
      console.log('❌ Password verification failed');
      return NextResponse.json(
        { error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    console.log('✅ Password verified successfully');

    // Generate tokens
    console.log('🎫 Generating tokens...');
    const userName = `${user.profile?.firstName || 'User'} ${user.profile?.lastName || ''}`.trim();
    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: userName
    });
    console.log('✅ Tokens generated successfully');

    // Store refresh token in Redis (skip for now to avoid Redis issues)
    console.log('💾 Skipping Redis storage for debugging...');
    // try {
    //   await AuthService.storeRefreshToken(user.id, tokens.refreshToken);
    //   console.log('✅ Refresh token stored successfully');
    // } catch (redisError) {
    //   console.log('❌ Redis error (but continuing):', redisError);
    // }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: `${user.profile?.firstName || 'User'} ${user.profile?.lastName || ''}`.trim(),
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: user.verification?.emailVerified || false
        },
        tokens
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}