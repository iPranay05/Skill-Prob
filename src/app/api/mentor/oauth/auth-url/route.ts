import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = authResult.user.userId;

    // Get mentor's credentials
    const { data: mentor, error } = await supabase
      .from('users')
      .select('google_client_id')
      .eq('id', userId)
      .eq('role', 'mentor')
      .single();

    if (error || !mentor?.google_client_id) {
      return NextResponse.json({ error: 'OAuth credentials not found' }, { status: 400 });
    }

    // Generate OAuth URL
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', mentor.google_client_id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    authUrl.searchParams.set('redirect_uri', `${baseUrl}/mentor/oauth/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', userId); // Pass user ID for security

    return NextResponse.json({ authUrl: authUrl.toString() });

  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}