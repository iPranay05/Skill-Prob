import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = authResult.user.userId;

    const { authCode } = await request.json();

    if (!authCode) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // Get mentor's credentials
    const { data: mentor, error } = await supabase
      .from('users')
      .select('google_client_id, google_client_secret')
      .eq('id', userId)
      .eq('role', 'mentor')
      .single();

    if (error || !mentor?.google_client_id || !mentor?.google_client_secret) {
      return NextResponse.json({ error: 'OAuth credentials not found' }, { status: 400 });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: mentor.google_client_id,
        client_secret: mentor.google_client_secret,
        code: authCode,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`}/mentor/oauth/callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.json({ 
        error: 'Failed to exchange authorization code' 
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();

    // Calculate token expiry
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Save tokens to mentor record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_access_token: tokenData.access_token,
        google_refresh_token: tokenData.refresh_token,
        google_token_expires_at: expiresAt.toISOString()
      })
      .eq('id', userId)
      .eq('role', 'mentor');

    if (updateError) {
      console.error('Error saving tokens:', updateError);
      return NextResponse.json({ error: 'Failed to save tokens' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in token exchange:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}