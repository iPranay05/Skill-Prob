const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function convertReferral(studentEmail, eventType = 'first_purchase', value = 100) {
  try {
    console.log(`Converting referral for ${studentEmail}...`);

    // Find the student
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', studentEmail)
      .single();

    if (studentError || !student) {
      throw new Error(`Student not found: ${studentEmail}`);
    }

    console.log(`Found student: ${student.id}`);

    // Find the referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('student_id', student.id)
      .single();

    if (referralError || !referral) {
      throw new Error(`Referral record not found for student: ${studentEmail}`);
    }

    console.log(`Found referral: ${referral.id}, current status: ${referral.status}`);

    // Get points configuration
    const { data: pointsConfig } = await supabase
      .from('point_configurations')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true)
      .single();

    const pointsEarned = pointsConfig?.points_awarded || 50;
    console.log(`Points to be earned: ${pointsEarned}`);

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

    const { error: updateError } = await supabase
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

    console.log('✅ Referral status updated to "converted"');

    // Update ambassador wallet and performance
    const { data: ambassador } = await supabase
      .from('ambassadors')
      .select('*')
      .eq('id', referral.ambassador_id)
      .single();

    if (ambassador) {
      console.log(`Updating ambassador: ${ambassador.id}`);

      // Get ambassador's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', ambassador.user_id)
        .single();

      if (wallet) {
        console.log(`Current wallet balance: ${wallet.balance.points} points`);

        // Add transaction
        const { error: transactionError } = await supabase
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

        if (transactionError) {
          console.error('Transaction error:', transactionError);
        } else {
          console.log('✅ Wallet transaction added');
        }

        // Update wallet balance
        const { error: walletUpdateError } = await supabase
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

        if (walletUpdateError) {
          console.error('Wallet update error:', walletUpdateError);
        } else {
          console.log(`✅ Wallet balance updated: ${(wallet.balance.points || 0) + pointsEarned} points`);
        }
      }

      // Update ambassador performance
      const performance = ambassador.performance || {};
      const { error: performanceError } = await supabase
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

      if (performanceError) {
        console.error('Performance update error:', performanceError);
      } else {
        console.log('✅ Ambassador performance updated');
      }
    }

    console.log('\n🎉 Referral conversion completed successfully!');
    console.log(`Student: ${studentEmail}`);
    console.log(`Event: ${eventType}`);
    console.log(`Points earned: ${pointsEarned}`);
    console.log(`Status: converted`);

  } catch (error) {
    console.error('❌ Error converting referral:', error.message);
    process.exit(1);
  }
}

// Run the script
const studentEmail = process.argv[2] || 'pranaynair2605@gmail.com';
const eventType = process.argv[3] || 'first_purchase';
const value = parseInt(process.argv[4]) || 100;

convertReferral(studentEmail, eventType, value);