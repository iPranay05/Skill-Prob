const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminKYCAPI() {
  try {
    console.log('🧪 Testing Admin KYC API logic...\n');

    // Test the exact query from the API
    console.log('1. First, let\'s see all ambassadors with payout_details...');

    const { data: allAmb, error: allError } = await supabase
      .from('ambassadors')
      .select('id, user_id, payout_details')
      .not('payout_details', 'is', null);

    console.log('All ambassadors with payout_details:', allAmb?.length || 0);
    allAmb?.forEach((amb, i) => {
      console.log(`Ambassador ${i + 1}:`);
      console.log(`  ID: ${amb.id}`);
      console.log(`  Status: ${amb.payout_details?.status}`);
      console.log(`  Status type: ${typeof amb.payout_details?.status}`);
      console.log(`  Full payout_details:`, JSON.stringify(amb.payout_details, null, 2));
    });

    console.log('\n2. Testing status filter...');

    let ambassadorQuery = supabase
      .from('ambassadors')
      .select('id, user_id, payout_details, created_at, updated_at')
      .not('payout_details', 'is', null)
      .order('updated_at', { ascending: false });

    // Filter by status
    const status = 'all';
    if (status && status !== 'all') {
      ambassadorQuery = ambassadorQuery.eq('payout_details->>status', status);
    }

    const { data: ambassadors, error } = await ambassadorQuery.range(0, 19);

    console.log('Ambassadors found:', ambassadors?.length || 0);
    console.log('Error:', error);

    if (ambassadors && ambassadors.length > 0) {
      console.log('\n2. Testing user lookup...');

      const userIds = ambassadors.map(amb => amb.user_id);
      console.log('User IDs to lookup:', userIds);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, profile')
        .in('id', userIds);

      console.log('Users found:', users?.length || 0);
      console.log('Users error:', usersError);

      if (users) {
        console.log('\n3. Formatted result:');

        const usersMap = new Map();
        users.forEach(user => {
          usersMap.set(user.id, user);
        });

        const formattedData = ambassadors.map(ambassador => {
          const user = usersMap.get(ambassador.user_id);
          return {
            id: ambassador.id,
            userId: ambassador.user_id,
            email: user?.email || 'Unknown',
            kycStatus: ambassador.payout_details?.status || 'not_submitted',
            verified: ambassador.payout_details?.verified || false,
            submittedAt: ambassador.payout_details?.submittedAt,
            fullName: ambassador.payout_details?.fullName
          };
        });

        console.log('Formatted data:', JSON.stringify(formattedData, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testAdminKYCAPI();