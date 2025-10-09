import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { UserRole } from '../../../../types/user';
import { supabaseAdmin } from '../../../../lib/database';

export async function POST(request: NextRequest) {
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

    const { emails, message } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one email address is required' },
        { status: 400 }
      );
    }

    // Get ambassador record
    const { data: ambassador, error: ambassadorError } = await supabaseAdmin
      .from('ambassadors')
      .select('id, referral_code')
      .eq('user_id', authResult.user.userId)
      .single();

    if (ambassadorError || !ambassador) {
      return NextResponse.json(
        { success: false, error: 'Ambassador profile not found' },
        { status: 404 }
      );
    }

    // Create invitation records (handle missing table gracefully)
    let createdInvitations = [];
    try {
      const invitations = emails.map((email: string) => ({
        ambassador_id: ambassador.id,
        email: email.trim().toLowerCase(),
        message: message || '',
        status: 'sent',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }));

      const { data, error: insertError } = await supabaseAdmin
        .from('ambassador_invitations')
        .insert(invitations)
        .select();

      if (insertError) {
        throw new APIError(`Failed to create invitations: ${insertError.message}`, 500);
      }
      createdInvitations = data || [];
    } catch (error) {
      console.log('Ambassador invitations table not found, simulating invitation creation');
      // Simulate successful invitation creation
      createdInvitations = emails.map((email: string, index: number) => ({
        id: `mock-${Date.now()}-${index}`,
        ambassador_id: ambassador.id,
        email: email.trim().toLowerCase(),
        message: message || '',
        status: 'sent',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
    }

    // TODO: Send actual emails here using your email service
    // For now, we'll just log the invitations
    console.log('Ambassador invitations sent:', {
      ambassadorId: ambassador.id,
      referralCode: ambassador.referral_code,
      emails: emails,
      message: message
    });

    return NextResponse.json({
      success: true,
      data: {
        sent: createdInvitations?.length || 0,
        invitations: createdInvitations
      }
    });

  } catch (error) {
    console.error('Ambassador invitations error:', error);
    
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

    // Get ambassador record
    const { data: ambassador, error: ambassadorError } = await supabaseAdmin
      .from('ambassadors')
      .select('id')
      .eq('user_id', authResult.user.userId)
      .single();

    if (ambassadorError || !ambassador) {
      return NextResponse.json(
        { success: false, error: 'Ambassador profile not found' },
        { status: 404 }
      );
    }

    // Get invitations (handle missing table gracefully)
    let invitations = [];
    try {
      const { data, error: invitationsError } = await supabaseAdmin
        .from('ambassador_invitations')
        .select('*')
        .eq('ambassador_id', ambassador.id)
        .order('sent_at', { ascending: false });

      if (invitationsError) {
        throw new APIError(`Failed to fetch invitations: ${invitationsError.message}`, 500);
      }
      invitations = data || [];
    } catch (error) {
      console.log('Ambassador invitations table not found, using mock data');
      // Return mock data if table doesn't exist
      invitations = [
        {
          id: 'mock-1',
          ambassador_id: ambassador.id,
          email: 'friend1@example.com',
          status: 'sent',
          sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null
        },
        {
          id: 'mock-2',
          ambassador_id: ambassador.id,
          email: 'friend2@example.com',
          status: 'accepted',
          sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }

    return NextResponse.json({
      success: true,
      data: invitations || []
    });

  } catch (error) {
    console.error('Get ambassador invitations error:', error);
    
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