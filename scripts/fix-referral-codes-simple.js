const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate referral code
function generateReferralCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

async function fixReferralCodes() {
    try {
        console.log('🔍 Checking for ambassadors with missing referral codes...');

        // Find ambassadors with null or empty referral codes
        const { data: ambassadors, error: fetchError } = await supabase
            .from('ambassadors')
            .select('id, user_id, referral_code, status')
            .or('referral_code.is.null,referral_code.eq.');

        if (fetchError) {
            console.error('❌ Error fetching ambassadors:', fetchError);
            return;
        }

        if (!ambassadors || ambassadors.length === 0) {
            console.log('✅ All ambassadors have referral codes!');

            // Show existing ambassadors for verification
            const { data: allAmbassadors } = await supabase
                .from('ambassadors')
                .select('id, referral_code, status')
                .limit(5);

            if (allAmbassadors && allAmbassadors.length > 0) {
                console.log('\n📊 Current ambassadors:');
                allAmbassadors.forEach(amb => {
                    console.log(`   ✅ ID: ${amb.id}, Code: ${amb.referral_code}, Status: ${amb.status}`);
                });
            }
            return;
        }

        console.log(`📝 Found ${ambassadors.length} ambassadors missing referral codes`);

        // Get all existing referral codes to avoid duplicates
        const { data: existingCodes } = await supabase
            .from('ambassadors')
            .select('referral_code')
            .not('referral_code', 'is', null);

        const usedCodes = new Set();
        if (existingCodes) {
            existingCodes.forEach(row => {
                if (row.referral_code) {
                    usedCodes.add(row.referral_code);
                }
            });
        }

        // Generate and assign unique codes
        let successCount = 0;
        for (const ambassador of ambassadors) {
            let code;
            let attempts = 0;

            // Generate unique code
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

            // Update the ambassador record
            const { error: updateError } = await supabase
                .from('ambassadors')
                .update({ referral_code: code })
                .eq('id', ambassador.id);

            if (updateError) {
                console.error(`❌ Failed to update ambassador ${ambassador.id}:`, updateError.message);
            } else {
                console.log(`✅ Updated ambassador ${ambassador.id} with code: ${code}`);
                successCount++;
            }
        }

        console.log(`\n🎉 Successfully updated ${successCount}/${ambassadors.length} ambassador referral codes!`);

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

// Run the fix
console.log('🚀 Starting referral code fix...\n');
fixReferralCodes()
    .then(() => {
        console.log('\n✨ Fix completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });