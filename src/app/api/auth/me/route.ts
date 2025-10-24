import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/database';

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

    // Fetch complete user data from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authResult.user.userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return complete user information
    return NextResponse.json({
      success: true,
      data: {
        id: userData.id,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        profile: userData.profile || {},
        verification: userData.verification || {
          emailVerified: false,
          phoneVerified: false,
          kycStatus: 'pending'
        },
        preferences: userData.preferences || {},
        referralCode: userData.referral_code,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at
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

/**
 * PUT /api/auth/me - Update current user information
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify the token and get user info
    const authResult = await verifyToken(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updateData = await request.json();
    const { phone, profile, preferences } = updateData;

    // Prepare update object
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (phone !== undefined) {
      updates.phone = phone;
    }

    if (profile) {
      // Get current profile and merge with new data
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('profile')
        .eq('id', authResult.user.userId)
        .single();

      updates.profile = {
        ...(currentUser?.profile || {}),
        ...profile
      };
    }

    if (preferences) {
      // Get current preferences and merge with new data
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('preferences')
        .eq('id', authResult.user.userId)
        .single();

      updates.preferences = {
        ...(currentUser?.preferences || {}),
        ...preferences
      };
    }

    // Update user data
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', authResult.user.userId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating user data:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update user data' },
        { status: 500 }
      );
    }

    // Return updated user information
    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profile: updatedUser.profile || {},
        verification: updatedUser.verification || {
          emailVerified: false,
          phoneVerified: false,
          kycStatus: 'pending'
        },
        preferences: updatedUser.preferences || {},
        referralCode: updatedUser.referral_code,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}