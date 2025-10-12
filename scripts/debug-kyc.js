const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugKYC() {
  try {
    console.log('🔍 Debugging KYC submissions...\n');

    // 1. Check all ambassadors
    const { data: allAmbassadors, error: allError } = await supabase
      .from('ambassadors')
      .select('*');

    if (allError) {
      console.log('❌ Error fetching ambassadors:', allError.message);
      return;
    }

    console.log(`📊 Total ambassadors: ${allAmbassadors?.length || 0}`);

    // 2. Check ambassadors with payout_details
    const ambassadorsWithKYC = allAmbassadors?.filter(amb => 
      amb.payout_details && Object.keys(amb.payout_details).length > 0
    ) || [];

    console.log(`📋 Ambassadors with KYC data: ${ambassadorsWithKYC.length}`);

    // 3. Show details of each KYC submission
    ambassadorsWithKYC.forEach((ambassador, index) => {
      console.log(`\n--- Ambassador ${index + 1} ---`);
      console.log(`ID: ${ambassador.id}`);
      console.log(`User ID: ${ambassador.user_id}`);
      console.log(`KYC Status: ${ambassador.payout_details?.status || 'not_set'}`);
      console.log(`Verified: ${ambassador.payout_details?.verified || false}`);
      console.log(`Submitted At: ${ambassador.payout_details?.submittedAt || 'not_set'}`);
      console.log(`Full Name: ${ambassador.payout_details?.fullName || 'not_set'}`);
      
      if (ambassador.payout_details?.bankAccount) {
        console.log(`Bank Account: ${ambassador.payout_details.bankAccount.accountNumber || 'not_set'}`);
      }
    });

    // 4. Test the admin query
    console.log('\n🔍 Testing admin query...');
    
    const { data: adminQuery, error: adminError } = await supabase
      .from('ambassadors')
      .select(`
        id,
        user_id,
        payout_details,
        created_at,
        updated_at,
        users!inner(
          id,
          email,
          profile
        )
      `)
      .not('payout_details', 'is', null)
      .eq('payout_details->status', 'pending_verification')
      .order('updated_at', { ascending: false });

    if (adminError) {
      console.log('❌ Admin query error:', adminError.message);
    } else {
      console.log(`✅ Admin query found: ${adminQuery?.length || 0} pending submissions`);
      
      adminQuery?.forEach((submission, index) => {
        console.log(`\nPending Submission ${index + 1}:`);
        console.log(`Email: ${submission.users?.email}`);
        console.log(`Status: ${submission.payout_details?.status}`);
        console.log(`Full Name: ${submission.payout_details?.fullName}`);
      });
    }

    // 5. Test alternative query
    console.log('\n🔍 Testing alternative query...');
    
    const { data: altQuery, error: altError } = await supabase
      .from('ambassadors')
      .select(`
        id,
        user_id,
        payout_details,
        users!inner(email)
      `)
      .not('payout_details', 'is', null);

    if (altError) {
      console.log('❌ Alternative query error:', altError.message);
    } else {
      console.log(`✅ Alternative query found: ${altQuery?.length || 0} submissions`);
      
      altQuery?.forEach((submission, index) => {
        const status = submission.payout_details?.status;
        if (status) {
          console.log(`Submission ${index + 1}: ${submission.users?.email} - ${status}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

// Run the debug
debugKYC();