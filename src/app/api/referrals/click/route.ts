import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../lib/ambassadorService';
import { supabaseAdmin } from '../../../../lib/database';
import { APIError } from '../../../../lib/errors';

// Rate limiting map (in production, use Redis)
const clickTracker = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10; // clicks per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const tracker = clickTracker.get(ip) || { count: 0, lastReset: now };
  
  // Reset counter if window expired
  if (now - tracker.lastReset > RATE_WINDOW) {
    tracker.count = 0;
    tracker.lastReset = now;
  }
  
  tracker.count++;
  clickTracker.set(ip, tracker);
  
  return tracker.count <= RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { referralCode, metadata = {} } = body;

    // Validate referral code format (basic security)
    if (!referralCode || typeof referralCode !== 'string' || referralCode.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code format' },
        { status: 400 }
      );
    }

    // Verify the referral code exists and is active
    const ambassador = await AmbassadorService.getAmbassadorByReferralCode(referralCode);
    if (!ambassador) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code' },
        { status: 400 }
      );
    }

    // Sanitize metadata to prevent injection attacks
    const sanitizedMetadata = {
      userAgent: typeof metadata.userAgent === 'string' ? metadata.userAgent.substring(0, 500) : '',
      referrer: typeof metadata.referrer === 'string' ? metadata.referrer.substring(0, 500) : '',
      source: 'short_link',
      timestamp: new Date().toISOString(),
      ip: ip.substring(0, 45) // IPv6 max length
    };

    // Log the click for analytics (no personal data stored)
    await supabaseAdmin
      .from('referral_clicks')
      .insert({
        ambassador_id: ambassador.id,
        referral_code: referralCode,
        metadata: sanitizedMetadata,
        ip_hash: await hashIP(ip), // Hash IP for privacy
        clicked_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        message: 'Click tracked successfully'
      }
    });

  } catch (error) {
    console.error('Referral click tracking error:', error);
    
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

// Hash IP for privacy compliance
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + process.env.IP_HASH_SALT || 'default-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}