import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../lib/ambassadorService';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';

export async function POST(request: NextRequest) {
  try {
    // For registration tracking, we need the user to be authenticated
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { referralCode, sourceData } = body;

    // Validate referral code
    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid referral code is required' },
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

    // Process the referral registration
    const referral = await AmbassadorService.processReferralRegistration(
      referralCode,
      authResult.user.userId,
      sourceData
    );

    return NextResponse.json({
      success: true,
      data: {
        referralId: referral.id,
        ambassadorCode: referral.referralCode,
        status: referral.status,
        registrationDate: referral.registrationDate
      }
    });

  } catch (error) {
    console.error('Referral tracking error:', error);
    
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
