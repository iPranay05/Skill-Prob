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
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Admin KYC API - Filter:', status, 'Limit:', limit, 'Offset:', offset);

    // Get ambassadors with KYC submissions (separate queries to avoid relationship issues)
    let ambassadorQuery = supabaseAdmin
      .from('ambassadors')
      .select('id, user_id, payout_details, created_at, updated_at')
      .not('payout_details', 'is', null)
      .order('updated_at', { ascending: false });

    // Filter by status if specified
    if (status && status !== 'all') {
      ambassadorQuery = ambassadorQuery.eq('payout_details->>status', status);
    }

    const { data: ambassadors, error } = await ambassadorQuery.range(offset, offset + limit - 1);

    console.log('Query result - Ambassadors found:', ambassadors?.length || 0);
    console.log('Query error:', error);

    if (error) {
      console.error('Database query error:', error);
      throw new APIError(`Failed to fetch KYC submissions: ${error.message}`, 500);
    }

    // Get user details separately
    const userIds = ambassadors?.map(amb => amb.user_id) || [];
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, profile')
      .in('id', userIds);

    if (usersError) {
      console.error('Users query error:', usersError);
    }

    // Create a map of users for easy lookup
    const usersMap = new Map();
    users?.forEach(user => {
      usersMap.set(user.id, user);
    });

    const formattedData = ambassadors?.map(ambassador => {
      const user = usersMap.get(ambassador.user_id);
      return {
        id: ambassador.id,
        userId: ambassador.user_id,
        email: user?.email || 'Unknown',
        profile: user?.profile || {},
        kycStatus: ambassador.payout_details?.status || 'not_submitted',
        verified: ambassador.payout_details?.verified || false,
        submittedAt: ambassador.payout_details?.submittedAt,
        verifiedAt: ambassador.payout_details?.verifiedAt,
        rejectionReason: ambassador.payout_details?.rejectionReason,
        // Include KYC data for admin review
        kycData: ambassador.payout_details?.fullName ? {
          fullName: ambassador.payout_details?.fullName,
          dateOfBirth: ambassador.payout_details?.dateOfBirth,
          address: ambassador.payout_details?.address,
          panNumber: ambassador.payout_details?.panNumber,
          aadharNumber: ambassador.payout_details?.aadharNumber,
          passportNumber: ambassador.payout_details?.passportNumber,
          bankAccount: ambassador.payout_details?.bankAccount,
          documents: ambassador.payout_details?.documents
        } : null
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        limit,
        offset,
        total: formattedData.length
      }
    });

  } catch (error) {
    console.error('KYC submissions fetch error:', error);
    
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

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { ambassadorId, action, rejectionReason } = body;

    if (!ambassadorId || !action) {
      return NextResponse.json(
        { success: false, error: 'Ambassador ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required when rejecting KYC' },
        { status: 400 }
      );
    }

    // Get current ambassador data
    const { data: ambassador, error: fetchError } = await supabaseAdmin
      .from('ambassadors')
      .select('*')
      .eq('id', ambassadorId)
      .single();

    if (fetchError || !ambassador) {
      return NextResponse.json(
        { success: false, error: 'Ambassador not found' },
        { status: 404 }
      );
    }

    // Update KYC status
    const updatedPayoutDetails = {
      ...ambassador.payout_details,
      status: action === 'approve' ? 'verified' : 'rejected',
      verified: action === 'approve',
      verifiedAt: action === 'approve' ? new Date().toISOString() : null,
      rejectedAt: action === 'reject' ? new Date().toISOString() : null,
      rejectionReason: action === 'reject' ? rejectionReason : null,
      reviewedBy: authResult.user.userId,
      reviewedAt: new Date().toISOString()
    };

    const { error: updateError } = await supabaseAdmin
      .from('ambassadors')
      .update({
        payout_details: updatedPayoutDetails,
        reviewed_at: new Date().toISOString(),
        reviewed_by: authResult.user.userId,
        review_notes: action === 'reject' ? rejectionReason : 'KYC approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', ambassadorId);

    if (updateError) {
      throw new APIError(`Failed to update KYC status: ${updateError.message}`, 500);
    }

    // Create audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: authResult.user.userId,
        action: `kyc_${action}d`,
        resource_type: 'ambassador',
        resource_id: ambassadorId,
        details: {
          action,
          rejectionReason: action === 'reject' ? rejectionReason : null,
          timestamp: new Date().toISOString()
        }
      });

    // TODO: Send notification to ambassador about KYC status update
    // This could be implemented using the notification system

    return NextResponse.json({
      success: true,
      data: {
        ambassadorId,
        action,
        status: updatedPayoutDetails.status,
        verified: updatedPayoutDetails.verified,
        reviewedAt: updatedPayoutDetails.reviewedAt,
        message: `KYC ${action}d successfully`
      }
    });

  } catch (error) {
    console.error('KYC review error:', error);
    
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