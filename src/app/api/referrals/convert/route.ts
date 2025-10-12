import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/database';
import { verifyToken } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (admin only for manual conversion)
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentEmail, eventType = 'first_purchase', value = 100 } = body;

    if (!studentEmail) {
      return NextResponse.json(
        { success: false, error: 'Student email is required' },
        { status: 400 }
      );
    }

    // Find the student
    const { data: student, error: studentError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', studentEmail)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Find the referral record
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('student_id', student.id)
      .single();

    if (referralError || !referral) {
      return NextResponse.json(
        { success: false, error: 'Referral record not found' },
        { status: 404 }
      );
    }

    // Get points configuration
    const { data: pointsConfig } = await supabaseAdmin
      .from('point_configurations')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true)
      .single();

    const pointsEarned = pointsConfig?.points_awarded || 50;

    // Create conversion event
    const conversionEvent = {
      type: eventType,
      date: new Date().toISOString(),
      value: value,
      pointsEarned: pointsEarned
    };

    // Update referral with conversion event
    const existingEvents = referral.conversion_events || [];
    const updatedEvents = [...existingEvents, conversionEvent];

    const { error: updateError } = await supabaseAdmin
      .from('referrals')
      .update({
        status: 'converted',
        conversion_events: updatedEvents,
        updated_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (updateError) {
      throw new Error(`Failed to update referral: ${updateError.message}`);
    }

    // Update ambassador wallet and performance
    const { data: ambassador } = await supabaseAdmin
      .from('ambassadors')
      .select('*')
      .eq('id', referral.ambassador_id)
      .single();

    if (ambassador) {
      // Get ambassador's wallet
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', ambassador.user_id)
        .single();

      if (wallet) {
        // Add transaction
        await supabaseAdmin
          .from('wallet_transactions')
          .insert({
            wallet_id: wallet.id,
            type: 'referral_bonus',
            amount: 0,
            points: pointsEarned,
            description: `${eventType} referral bonus for ${studentEmail}`,
            reference_id: referral.id,
            balance_after: {
              points: (wallet.balance.points || 0) + pointsEarned,
              credits: wallet.balance.credits || 0,
              currency: wallet.balance.currency || 'INR'
            }
          });

        // Update wallet balance
        await supabaseAdmin
          .from('wallets')
          .update({
            balance: {
              points: (wallet.balance.points || 0) + pointsEarned,
              credits: wallet.balance.credits || 0,
              currency: wallet.balance.currency || 'INR'
            },
            total_earned: (wallet.total_earned || 0) + (value * 0.1), // 10% commission
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);
      }

      // Update ambassador performance
      const performance = ambassador.performance || {};
      await supabaseAdmin
        .from('ambassadors')
        .update({
          performance: {
            ...performance,
            successfulConversions: (performance.successfulConversions || 0) + 1,
            totalEarnings: (performance.totalEarnings || 0) + (value * 0.1),
            currentPoints: (performance.currentPoints || 0) + pointsEarned,
            lifetimePoints: (performance.lifetimePoints || 0) + pointsEarned
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', ambassador.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        referralId: referral.id,
        studentEmail: studentEmail,
        eventType: eventType,
        pointsEarned: pointsEarned,
        newStatus: 'converted',
        message: 'Referral converted successfully'
      }
    });

  } catch (error) {
    console.error('Referral conversion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}