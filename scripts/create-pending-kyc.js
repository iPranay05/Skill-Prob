const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPendingKYC() {
  try {
    console.log('🧪 Creating a pending KYC submission for testing...\n');

    // Find an ambassador without KYC
    const { data: ambassadors, error } = await supabase
      .from('ambassadors')
      .select('*')
      .or('payout_details.is.null,payout_details.eq.{}')
      .limit(1);

    if (error || !ambassadors || ambassadors.length === 0) {
      console.log('❌ No ambassadors found without KYC');
      return;
    }

    const ambassador = ambassadors[0];
    console.log(`✅ Found ambassador: ${ambassador.id}`);

    // Create mock KYC data
    const mockKYCData = {
      fullName: 'Test User',
      dateOfBirth: '1995-01-01',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '123456',
        country: 'India'
      },
      panNumber: 'ABCDE1234F',
      aadharNumber: '1234 5678 9012',
      bankAccount: {
        accountNumber: '9876543210',
        routingNumber: 'TEST0001234',
        bankName: 'Test Bank',
        accountHolderName: 'Test User',
        accountType: 'savings'
      },
      documents: {
        panCard: 'test_pan_card.pdf',
        bankStatement: 'test_bank_statement.pdf'
      },
      verified: false,
      submittedAt: new Date().toISOString(),
      status: 'pending_verification'
    };

    // Update ambassador with KYC data
    const { error: updateError } = await supabase
      .from('ambassadors')
      .update({
        payout_details: mockKYCData,
        updated_at: new Date().toISOString()
      })
      .eq('id', ambassador.id);

    if (updateError) {
      console.log('❌ Error creating KYC:', updateError.message);
      return;
    }

    console.log('✅ Created pending KYC submission!');
    console.log(`Ambassador ID: ${ambassador.id}`);
    console.log(`Status: pending_verification`);
    console.log(`Full Name: ${mockKYCData.fullName}`);

    console.log('\n🎉 Now you should see this submission in the admin KYC page!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
createPendingKYC();