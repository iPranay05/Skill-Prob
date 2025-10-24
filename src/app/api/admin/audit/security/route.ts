import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and super admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Super admin role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      console.error('Error fetching security events:', eventsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch security events' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('security_events')
      .select('*', { count: 'exact', head: true });

    if (severity) countQuery = countQuery.eq('severity', severity);
    if (resolved !== null) countQuery = countQuery.eq('resolved', resolved === 'true');

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting security events:', countError);
    }

    return NextResponse.json({
      success: true,
      data: {
        events: events || [],
        total: count || 0,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Security events fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication and super admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Super admin role required.' },
        { status: 403 }
      );
    }

    const { eventId, resolved } = await request.json();

    if (!eventId || resolved === undefined) {
      return NextResponse.json(
        { success: false, error: 'Event ID and resolved status are required' },
        { status: 400 }
      );
    }

    // Update security event
    const { data, error } = await supabaseAdmin
      .from('security_events')
      .update({ 
        resolved: resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolved_by: resolved ? authResult.user.userId : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating security event:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update security event' },
        { status: 500 }
      );
    }

    // Log the security event resolution
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: authResult.user.userId,
          user_email: authResult.user.email,
          user_role: authResult.user.role,
          action: resolved ? 'security_event_resolved' : 'security_event_reopened',
          resource: 'security_events',
          resource_id: eventId,
          details: {
            eventType: data.event_type,
            severity: data.severity,
            resolved: resolved
          },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
    } catch (auditError) {
      console.error('Failed to log security event resolution:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Security event update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}