const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAmbassadors() {
  try {
    console.log('👥 Checking ambassador records...\n');

    // Get all ambassadors
    const { data: ambassadors, error } = await supabase
      .from('ambassadors')
      .select('id, user_id, referral_code, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching ambassadors:', error.message);
      return;
    }

    if (!ambassadors || ambassadors.length === 0) {
      console.log('📭 No ambassadors found in database');
      return;
    }

    console.log(`📊 Found ${ambassadors.length} ambassadors:\n`);

    let missingCodes = 0;
    ambassadors.forEach((amb, index) => {
      const hasCode = amb.referral_code && amb.referral_code.trim() !== '';
      const status = hasCode ? '✅' : '❌';
      
      if (!hasCode) missingCodes++;
      
      console.log(`${index + 1}. ${status} ID: ${amb.id}`);
      console.log(`   User ID: ${amb.user_id}`);
      console.log(`   Code: ${amb.referral_code || 'MISSING'}`);
      console.log(`   Status: ${amb.status}`);
      console.log(`   Created: ${new Date(amb.created_at).toLocaleDateString()}`);
      console.log('');
    });

    if (missingCodes > 0) {
      console.log(`⚠️  ${missingCodes} ambassadors are missing referral codes`);
      console.log('💡 Run: node scripts/fix-referral-codes-simple.js');
    } else {
      console.log('🎉 All ambassadors have referral codes!');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the check
checkAmbassadors()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });