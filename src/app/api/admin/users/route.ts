import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { UserRole } from '../../../../types/user';
import { supabaseAdmin } from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== UserRole.ADMIN && authResult.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        role,
        profile,
        verification,
        created_at,
        updated_at,
        last_login_at,
        status
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filter !== 'all') {
      if (['student', 'mentor', 'ambassador', 'admin', 'super_admin'].includes(filter)) {
        query = query.eq('role', filter);
      } else if (['active', 'suspended', 'pending'].includes(filter)) {
        query = query.eq('status', filter);
      }
    }

    // Apply search
    if (search) {
      query = query.or(`email.ilike.%${search}%,profile->>firstName.ilike.%${search}%,profile->>lastName.ilike.%${search}%`);
    }

    // Apply pagination
    const { data: users, error, count } = await query
      .range(offset, offset + limit - 1)
      .select('*', { count: 'exact' });

    if (error) {
      throw new APIError(`Failed to fetch users: ${error.message}`, 500);
    }

    // Format the response
    const formattedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile || {},
      verification: user.verification || { emailVerified: false, phoneVerified: false },
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      status: user.status || 'active'
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Admin users fetch error:', error);
    
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