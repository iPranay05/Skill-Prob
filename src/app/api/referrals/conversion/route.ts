import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../lib/ambassadorService';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { ReferralEventType } from '../../../../models/Ambassador';
import { supabaseAdmin } from '../../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (this should be called from internal services)
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentId, eventType, value, metadata } = body;

    // Validate required fields
    if (!studentId || !eventType || typeof value !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentId, eventType, value' },
        { status: 400 }
      );
    }

    // Validate event type
    if (!Object.values(ReferralEventType).includes(eventType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Find the referral record for this student
    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'pending')
      .limit(1);

    if (error) {
      throw new APIError(`Failed to find referral: ${error.message}`, 500);
    }

    if (!referrals || referrals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active referral found for this student' },
        { status: 404 }
      );
    }

    const referralId = referrals[0].id;

    // Add conversion event
    await AmbassadorService.addConversionEvent(
      referralId,
      eventType,
      value,
      metadata
    );

    return NextResponse.json({
      success: true,
      data: {
        referralId,
        eventType,
        value,
        message: 'Conversion event recorded successfully'
      }
    });

  } catch (error) {
    console.error('Conversion tracking error:', error);
    
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
