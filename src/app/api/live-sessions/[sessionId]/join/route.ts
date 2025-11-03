import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { sessionId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is available for joining
    const now = new Date();
    const startTime = new Date(session.scheduled_start_time);
    const endTime = new Date(session.scheduled_end_time);

    if (now < startTime) {
      return NextResponse.json({
        error: 'Session has not started yet'
      }, { status: 400 });
    }

    if (now > endTime) {
      return NextResponse.json({
        error: 'Session has already ended'
      }, { status: 400 });
    }

    if (session.status === 'cancelled') {
      return NextResponse.json({
        error: 'Session has been cancelled'
      }, { status: 400 });
    }

    // For now, we'll skip participant tracking and just allow joining
    // TODO: Implement participant tracking when the table is created

    // Update session status to live if it's still scheduled and within time window
    if (session.status === 'scheduled' && now >= startTime) {
      await supabase
        .from('live_sessions')
        .update({ status: 'live' })
        .eq('id', sessionId);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined session',
      data: {
        sessionId,
        googleMeetLink: session.google_meet_link
      }
    });
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}