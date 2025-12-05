import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database';

export async function GET() {
  try {
    // Test 1: Check connection
    const { data: healthCheck, error: healthError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    // Test 2: Try to list tables (this might not work with RLS)
    const { data: tables, error: tablesError } = await supabaseAdmin
      .rpc('get_tables');

    // Test 3: Try a simple query
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(5);

    return NextResponse.json({
      success: true,
      tests: {
        healthCheck: {
          success: !healthError,
          error: healthError ? {
            message: healthError.message,
            code: healthError.code,
            details: healthError.details,
            hint: healthError.hint
          } : null,
          data: healthCheck
        },
        tables: {
          success: !tablesError,
          error: tablesError?.message,
          data: tables
        },
        users: {
          success: !usersError,
          error: usersError ? {
            message: usersError.message,
            code: usersError.code,
            details: usersError.details,
            hint: usersError.hint
          } : null,
          count: users?.length || 0
        }
      },
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
