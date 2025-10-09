import { NextRequest, NextResponse } from 'next/server';
import { walletService } from '@/lib/walletService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const ProcessPayoutSchema = z.object({
  payoutRequestId: z.string().uuid(),
  approved: z.boolean(),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get payout requests from database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: payoutRequests, error } = await supabase
      .from('payout_requests')
      .select(`
        *,
        ambassadors(
          user_id,
          referral_code,
          users(email, profile)
        )
      `)
      .eq('status', status)
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payout requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        payoutRequests: payoutRequests || [],
        pagination: {
          limit,
          offset,
          hasMore: (payoutRequests || []).length === limit
        }
      }
    });
  } catch (error) {
    console.error('Admin payouts API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = ProcessPayoutSchema.parse(body);

    // Process payout request
    const result = await walletService.processPayoutRequest(
      validatedData.payoutRequestId,
      validatedData.approved,
      authResult.user.id,
      validatedData.notes
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Payout request ${validatedData.approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Process payout API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}