const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate referral code fallback
function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

async function fixMissingReferralCodes() {
  try {
    console.log('🔍 Checking for ambassadors with missing referral codes...');

    // Find ambassadors with null or empty referral codes
    const { data: ambassadors, error: fetchError } = await supabase
      .from('ambassadors')
      .select('id, user_id, referral_code')
      .or('referral_code.is.null,referral_code.eq.');

    if (fetchError) {
      throw fetchError;
    }

    if (!ambassadors || ambassadors.length === 0) {
      console.log('✅ All ambassadors have referral codes!');
      return;
    }

    console.log(`📝 Found ${ambassadors.length} ambassadors missing referral codes`);

    // Generate unique codes for each ambassador
    const updates = [];
    const usedCodes = new Set();

    // First, get all existing referral codes to avoid duplicates
    const { data: existingCodes } = await supabase
      .from('ambassadors')
      .select('referral_code')
      .not('referral_code', 'is', null);

    if (existingCodes) {
      existingCodes.forEach(row => {
        if (row.referral_code) {
          usedCodes.add(row.referral_code);
        }
      });
    }

    // Generate unique codes for missing ones
    for (const ambassador of ambassadors) {
      let code;
      let attempts = 0;
      
      do {
        code = generateReferralCode();
        attempts++;
      } while (usedCodes.has(code) && attempts < 20);

      if (attempts >= 20) {
        // Fallback with timestamp
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        code = `AMB${timestamp}`;
      }

      usedCodes.add(code);
      updates.push({
        id: ambassador.id,
        referral_code: code
      });

      console.log(`📋 Ambassador ${ambassador.id} -> ${code}`);
    }

    // Update all ambassadors with their new referral codes
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('ambassadors')
        .update({ referral_code: update.referral_code })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ Failed to update ambassador ${update.id}:`, updateError);
      } else {
        console.log(`✅ Updated ambassador ${update.id} with code ${update.referral_code}`);
      }
    }

    console.log(`🎉 Successfully fixed ${updates.length} ambassador referral codes!`);

  } catch (error) {
    console.error('❌ Error fixing referral codes:', error);
    process.exit(1);
  }
}

// Run the fix
fixMissingReferralCodes()
  .then(() => {
    console.log('✨ Referral code fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });