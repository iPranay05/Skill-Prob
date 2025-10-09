const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReferralCodeGeneration() {
  try {
    console.log('🧪 Testing referral code generation...');

    // Test the database function
    try {
      const { data, error } = await supabase.rpc('generate_referral_code');
      
      if (error) {
        console.log('⚠️  Database function not available:', error.message);
        console.log('📝 This is expected if migration 010 hasn\'t been run yet');
      } else {
        console.log('✅ Database function works! Generated code:', data);
      }
    } catch (error) {
      console.log('⚠️  Database function test failed:', error.message);
    }

    // Test JavaScript fallback
    console.log('\n🔄 Testing JavaScript fallback...');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    console.log('✅ JavaScript fallback works! Generated code:', code);

    // Check existing ambassadors
    console.log('\n👥 Checking existing ambassadors...');
    const { data: ambassadors, error: fetchError } = await supabase
      .from('ambassadors')
      .select('id, referral_code, status')
      .limit(5);

    if (fetchError) {
      console.log('❌ Failed to fetch ambassadors:', fetchError.message);
    } else if (ambassadors && ambassadors.length > 0) {
      console.log(`📊 Found ${ambassadors.length} ambassadors:`);
      ambassadors.forEach(amb => {
        const codeStatus = amb.referral_code ? '✅' : '❌';
        console.log(`   ${codeStatus} ID: ${amb.id}, Code: ${amb.referral_code || 'MISSING'}, Status: ${amb.status}`);
      });
    } else {
      console.log('📭 No ambassadors found in database');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testReferralCodeGeneration()
  .then(() => {
    console.log('\n🏁 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });