import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../lib/ambassadorService';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { AmbassadorApplication } from '../../../../models/Ambassador';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { motivation, socialMedia, experience, expectedReferrals, marketingStrategy } = body;

    // Validate required fields
    if (!motivation || !socialMedia || !experience) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: motivation, socialMedia, experience' },
        { status: 400 }
      );
    }

    // Validate motivation length
    if (motivation.length < 50 || motivation.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Motivation must be between 50 and 1000 characters' },
        { status: 400 }
      );
    }

    // Validate experience length
    if (experience.length < 20 || experience.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Experience must be between 20 and 500 characters' },
        { status: 400 }
      );
    }

    // Validate social media array
    if (!Array.isArray(socialMedia) || socialMedia.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one social media profile is required' },
        { status: 400 }
      );
    }

    // Validate each social media entry
    for (const social of socialMedia) {
      if (!social.platform || !social.handle || typeof social.followers !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Each social media entry must have platform, handle, and followers count' },
          { status: 400 }
        );
      }
    }

    const application: AmbassadorApplication = {
      motivation,
      socialMedia,
      experience,
      expectedReferrals,
      marketingStrategy
    };

    const ambassador = await AmbassadorService.applyForAmbassador(
      authResult.user.userId,
      application
    );

    return NextResponse.json({
      success: true,
      data: {
        id: ambassador.id,
        referralCode: ambassador.referralCode,
        status: ambassador.status,
        createdAt: ambassador.createdAt
      }
    });

  } catch (error) {
    console.error('Ambassador application error:', error);
    
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
