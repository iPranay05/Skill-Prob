import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await context.params;
    const userId = authResult.user.userId;

    // Check if course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, pricing')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment record
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        student_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        status: 'active',
        progress: 0
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError);
      return NextResponse.json(
        { success: false, error: 'Failed to enroll in course' },
        { status: 500 }
      );
    }

    // ✅ AUTOMATIC REFERRAL CONVERSION
    // Check if this student was referred by an ambassador
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('student_id', userId)
        .eq('status', 'pending')
        .single();

      if (referral) {
        console.log('🎯 Found pending referral, converting...', referral.id);
        
        // Get points configuration
        const { data: pointsConfig } = await supabase
          .from('point_configurations')
          .select('*')
          .eq('event_type', 'first_purchase')
          .eq('is_active', true)
          .single();

        const pointsEarned = pointsConfig?.points_awarded || 50;
        const courseValue = course.pricing?.amount || 0;

        // Create conversion event
        const conversionEvent = {
          type: 'first_purchase',
          date: new Date().toISOString(),
          value: courseValue,
          pointsEarned: pointsEarned,
          courseId: courseId,
          courseName: course.title
        };

        // Update referral status to converted
        const existingEvents = referral.conversion_events || [];
        await supabase
          .from('referrals')
          .update({
            status: 'converted',
            conversion_events: [...existingEvents, conversionEvent],
            updated_at: new Date().toISOString()
          })
          .eq('id', referral.id);

        // Get ambassador and wallet
        const { data: ambassador } = await supabase
          .from('ambassadors')
          .select('id, user_id, performance')
          .eq('id', referral.ambassador_id)
          .single();

        if (ambassador) {
          const { data: wallet } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', ambassador.user_id)
            .single();

          if (wallet) {
            // Add wallet transaction
            await supabase
              .from('wallet_transactions')
              .insert({
                wallet_id: wallet.id,
                type: 'referral_bonus',
                amount: 0,
                points: pointsEarned,
                description: `Referral bonus for ${course.title} enrollment`,
                reference_id: referral.id,
                balance_after: {
                  points: (wallet.balance.points || 0) + pointsEarned,
                  credits: wallet.balance.credits || 0,
                  currency: wallet.balance.currency || 'INR'
                }
              });

            // Update wallet balance
            await supabase
              .from('wallets')
              .update({
                balance: {
                  points: (wallet.balance.points || 0) + pointsEarned,
                  credits: wallet.balance.credits || 0,
                  currency: wallet.balance.currency || 'INR'
                },
                total_earned: (wallet.total_earned || 0) + (courseValue * 0.1),
                updated_at: new Date().toISOString()
              })
              .eq('id', wallet.id);
          }

          // Update ambassador performance
          const performance = ambassador.performance || {};
          await supabase
            .from('ambassadors')
            .update({
              performance: {
                ...performance,
                successfulConversions: (performance.successfulConversions || 0) + 1,
                totalEarnings: (performance.totalEarnings || 0) + (courseValue * 0.1),
                currentPoints: (performance.currentPoints || 0) + pointsEarned,
                lifetimePoints: (performance.lifetimePoints || 0) + pointsEarned
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', ambassador.id);

          console.log('✅ Referral converted successfully! Points awarded:', pointsEarned);
        }
      }
    } catch (referralError) {
      // Don't fail enrollment if referral conversion fails
      console.error('Referral conversion error (non-critical):', referralError);
    }

    return NextResponse.json({
      success: true,
      data: {
        enrollment,
        message: `Successfully enrolled in ${course.title}`
      }
    });

  } catch (error) {
    console.error('Enrollment API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check enrollment status
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await context.params;
    const userId = authResult.user.userId;

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        isEnrolled: !!enrollment,
        enrollment
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
