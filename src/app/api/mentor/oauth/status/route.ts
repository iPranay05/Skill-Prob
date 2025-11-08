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

    // Get mentor's OAuth status
    const { data: mentor, error } = await supabase
      .from('users')
      .select('oauth_setup_completed, oauth_setup_date')
      .eq('id', userId)
      .eq('role', 'mentor')
      .single();

    if (error) {
      console.error('Error fetching mentor OAuth status:', error);
      return NextResponse.json({ error: 'Failed to fetch OAuth status' }, { status: 500 });
    }

    return NextResponse.json({
      hasSetup: mentor?.oauth_setup_completed || false,
      setupDate: mentor?.oauth_setup_date
    });

  } catch (error) {
    console.error('Error in OAuth status check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}