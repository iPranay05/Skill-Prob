import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { success, user } = await verifyToken(request);
    
    if (!success || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a student
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Access denied. Student role required.' },
        { status: 403 }
      );
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, profile')
      .eq('id', user.userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { success, user } = await verifyToken(request);
    
    if (!success || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a student
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Access denied. Student role required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate and sanitize profile data
    const profileUpdates = {
      firstName: body.profile?.firstName?.trim(),
      lastName: body.profile?.lastName?.trim(),
      bio: body.profile?.bio?.trim(),
      avatar: body.profile?.avatar?.trim(),
      education: body.profile?.education || [],
      skills: body.profile?.skills || [],
      resume_url: body.profile?.resume_url?.trim(),
      portfolio_url: body.profile?.portfolio_url?.trim(),
      linkedin_url: body.profile?.linkedin_url?.trim(),
      github_url: body.profile?.github_url?.trim()
    };

    // Remove empty strings and null values
    Object.keys(profileUpdates).forEach(key => {
      if (profileUpdates[key as keyof typeof profileUpdates] === '' || 
          profileUpdates[key as keyof typeof profileUpdates] === null) {
        delete profileUpdates[key as keyof typeof profileUpdates];
      }
    });

    // Update user profile
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({ 
        profile: profileUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.userId)
      .select('id, email, profile')
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}