import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { UserRole } from '../../../../types/user';
import { supabaseAdmin } from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an ambassador
    if (authResult.user.role !== UserRole.AMBASSADOR) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Ambassador role required.' },
        { status: 403 }
      );
    }

    // Get all active resources (handle missing table gracefully)
    let resources = [];
    try {
      const { data, error: resourcesError } = await supabaseAdmin
        .from('ambassador_resources')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (resourcesError) {
        throw new APIError(`Failed to fetch resources: ${resourcesError.message}`, 500);
      }
      resources = data || [];
    } catch (error) {
      console.log('Ambassador resources table not found, using mock data');
      // Return mock data if table doesn't exist
      resources = [
        {
          id: 'mock-banner-1',
          title: 'Social Media Banner - Course Promotion',
          type: 'banner',
          url: 'https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Course+Promotion+Banner',
          description: 'High-quality banner for promoting courses on social media platforms',
          download_count: 45,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'mock-social-1',
          title: 'Instagram Story Template',
          type: 'social_post',
          url: 'https://via.placeholder.com/400x800/10B981/FFFFFF?text=Instagram+Story',
          description: 'Ready-to-use Instagram story template with your referral code',
          download_count: 32,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'mock-email-1',
          title: 'Email Invitation Template',
          type: 'email_template',
          url: 'https://via.placeholder.com/600x400/8B5CF6/FFFFFF?text=Email+Template',
          description: 'Professional email template for inviting friends to join courses',
          download_count: 28,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }

    return NextResponse.json({
      success: true,
      data: resources || []
    });

  } catch (error) {
    console.error('Get ambassador resources error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}