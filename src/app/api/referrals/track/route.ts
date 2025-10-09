import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../lib/ambassadorService';
import { verifyToken } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/database';
import { APIError } from '../../../../lib/errors';

export async function POST(request: NextRequest) {
  try {
    // For conversion tracking, we need the user to be authenticated
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { referralCode, sourceData = {} } = body;

    // Validate referral code format
    if (!referralCode || typeof referralCode !== 'string' || !/^[A-Za-z0-9]{3,20}$/.test(referralCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code format' },
        { status: 400 }
      );
    }

    // Verify the referral code exists and is active
    const ambassador = await AmbassadorService.getAmbassadorByReferralCode(referralCode);
    if (!ambassador) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive referral code' },
        { status: 400 }
      );
    }

    // Prevent self-referrals (security measure)
    if (ambassador.userId === authResult.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Self-referrals are not allowed' },
        { status: 400 }
      );
    }

    // Check if user already has a referral (prevent duplicate referrals)
    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('student_id', authResult.user.userId)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { success: false, error: 'User already has a referral record' },
        { status: 409 }
      );
    }

    // Sanitize source data
    const sanitizedSourceData = {
      source: 'registration',
      userAgent: typeof sourceData.userAgent === 'string' ? sourceData.userAgent.substring(0, 500) : '',
      referrer: typeof sourceData.referrer === 'string' ? sourceData.referrer.substring(0, 500) : '',
      timestamp: new Date().toISOString()
    };

    // Process the referral registration
    const referral = await AmbassadorService.processReferralRegistration(
      referralCode,
      authResult.user.userId,
      sanitizedSourceData
    );

    return NextResponse.json({
      success: true,
      data: {
        referralId: referral.id,
        status: referral.status,
        message: 'Referral processed successfully'
      }
    });

  } catch (error) {
    console.error('Referral conversion tracking error:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const referralCode = searchParams.get('code');

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Verify the referral code exists and is active
    const ambassador = await AmbassadorService.getAmbassadorByReferralCode(referralCode);
    if (!ambassador) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive referral code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        ambassadorCode: ambassador.referralCode,
        // Don't expose sensitive ambassador information
        message: 'Valid referral code'
      }
    });

  } catch (error) {
    console.error('Referral validation error:', error);
    
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
