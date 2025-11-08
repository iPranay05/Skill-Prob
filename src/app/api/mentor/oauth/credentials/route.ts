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

    const { projectId, clientId, clientSecret } = await request.json();

    if (!projectId || !clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    // Validate Client ID format
    if (!clientId.includes('.apps.googleusercontent.com')) {
      return NextResponse.json({ error: 'Invalid Client ID format' }, { status: 400 });
    }

    // Save credentials to mentor record
    const { error } = await supabase
      .from('users')
      .update({
        google_project_id: projectId,
        google_client_id: clientId,
        google_client_secret: clientSecret
      })
      .eq('id', userId)
      .eq('role', 'mentor');

    if (error) {
      console.error('Error saving OAuth credentials:', error);
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in OAuth credentials save:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}