import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const ProcessRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(1)
});

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
    const validatedData = ProcessRefundSchema.parse(body);

    // Process refund
    const result = await paymentService.processRefund(
      validatedData.paymentId,
      validatedData.amount,
      validatedData.reason,
      authResult.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        paymentId: result.paymentId,
        orderId: result.orderId
      }
    });
  } catch (error) {
    console.error('Process refund API error:', error);
    
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get refunds from database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('refunds')
      .select(`
        *,
        payments(*),
        users(email, profile)
      `)
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: refunds, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch refunds' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        refunds: refunds || [],
        pagination: {
          limit,
          offset,
          hasMore: (refunds || []).length === limit
        }
      }
    });
  } catch (error) {
    console.error('Admin refunds API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}