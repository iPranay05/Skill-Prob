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
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) {
      query = query.ilike('action', `%${action}%`);
    }
    if (resource) {
      query = query.ilike('resource', `%${resource}%`);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching audit logs:', logsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (action) countQuery = countQuery.ilike('action', `%${action}%`);
    if (resource) countQuery = countQuery.ilike('resource', `%${resource}%`);
    if (userId) countQuery = countQuery.eq('user_id', userId);
    if (dateFrom) countQuery = countQuery.gte('created_at', dateFrom);
    if (dateTo) countQuery = countQuery.lte('created_at', dateTo);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting audit logs:', countError);
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        total: count || 0,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}