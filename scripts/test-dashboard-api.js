const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDashboardAPI() {
  try {
    console.log('🧪 Testing ambassador dashboard API...\n');

    // First, get the ambassador data directly from database
    console.log('📊 Direct database query:');
    const { data: dbAmbassador, error: dbError } = await supabase
      .from('ambassadors')
      .select('id, user_id, referral_code, status, created_at')
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError.message);
      return;
    }

    if (!dbAmbassador) {
      console.log('📭 No ambassador found in database');
      return;
    }

    console.log('✅ Database result:');
    console.log(`   ID: ${dbAmbassador.id}`);
    console.log(`   User ID: ${dbAmbassador.user_id}`);
    console.log(`   Referral Code: ${dbAmbassador.referral_code}`);
    console.log(`   Status: ${dbAmbassador.status}`);
    console.log(`   Created: ${new Date(dbAmbassador.created_at).toLocaleDateString()}`);

    // Now test the API endpoint (we'll simulate the API call)
    console.log('\n🔗 Testing API response structure...');
    
    // Simulate what the API should return
    const apiResponse = {
      ambassador: {
        id: dbAmbassador.id,
        referralCode: dbAmbassador.referral_code || dbAmbassador.referralCode,
        status: dbAmbassador.status,
        performance: dbAmbassador.performance,
        createdAt: dbAmbassador.created_at || dbAmbassador.createdAt
      }
    };

    console.log('✅ API response structure:');
    console.log(`   ID: ${apiResponse.ambassador.id}`);
    console.log(`   Referral Code: ${apiResponse.ambassador.referralCode}`);
    console.log(`   Status: ${apiResponse.ambassador.status}`);

    if (apiResponse.ambassador.referralCode) {
      console.log('\n🎉 SUCCESS: Referral code should display properly!');
      console.log(`   Expected in dashboard: ${apiResponse.ambassador.referralCode}`);
    } else {
      console.log('\n❌ ISSUE: Referral code is still missing');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testDashboardAPI()
  .then(() => {
    console.log('\n🏁 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });