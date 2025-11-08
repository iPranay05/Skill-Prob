import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function refreshAccessToken(mentor: any) {
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: mentor.google_client_id,
      client_secret: mentor.google_client_secret,
      refresh_token: mentor.google_refresh_token,
      grant_type: 'refresh_token'
    })
  });

  if (!refreshResponse.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokenData = await refreshResponse.json();

  // Calculate new expiry
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

  // Update tokens in database
  await supabase
    .from('users')
    .update({
      google_access_token: tokenData.access_token,
      google_token_expires_at: expiresAt.toISOString()
    })
    .eq('id', mentor.id);

  return tokenData.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = authResult.user.userId;

    // Get mentor's credentials and tokens
    const { data: mentor, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('role', 'mentor')
      .single();

    if (error || !mentor?.google_access_token || !mentor?.google_refresh_token) {
      return NextResponse.json({ error: 'OAuth tokens not found' }, { status: 400 });
    }

    let accessToken = mentor.google_access_token;

    // Check if token is expired and refresh if needed
    const tokenExpiry = new Date(mentor.google_token_expires_at);
    const now = new Date();

    if (tokenExpiry <= now) {
      try {
        accessToken = await refreshAccessToken(mentor);
      } catch (error) {
        console.error('Token refresh failed:', error);
        return NextResponse.json({ error: 'Failed to refresh access token' }, { status: 401 });
      }
    }

    // Test API call - get calendar list
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      console.error('Calendar API test failed:', errorData);
      return NextResponse.json({ error: 'Google Calendar API test failed' }, { status: 400 });
    }

    const calendarData = await calendarResponse.json();

    // Mark OAuth setup as completed
    await supabase
      .from('users')
      .update({
        oauth_setup_completed: true,
        oauth_setup_date: new Date().toISOString()
      })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      calendarsFound: calendarData.items?.length || 0,
      primaryCalendar: calendarData.items?.find((cal: any) => cal.primary)?.summary || 'Unknown'
    });

  } catch (error) {
    console.error('Error in OAuth test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}