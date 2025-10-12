const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testKYCFlow() {
  try {
    console.log('🧪 Testing KYC Flow...\n');

    // 1. Find an ambassador
    const { data: ambassadors, error: ambassadorError } = await supabase
      .from('ambassadors')
      .select('*')
      .limit(1);

    if (ambassadorError || !ambassadors || ambassadors.length === 0) {
      console.log('❌ No ambassadors found. Please create an ambassador first.');
      return;
    }

    const ambassador = ambassadors[0];
    console.log(`✅ Found ambassador: ${ambassador.id}`);

    // 2. Check current KYC status
    console.log('\n📋 Current KYC Status:');
    console.log(`Status: ${ambassador.payout_details?.status || 'not_submitted'}`);
    console.log(`Verified: ${ambassador.payout_details?.verified || false}`);

    // 3. Simulate KYC submission
    const mockKYCData = {
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India'
      },
      panNumber: 'ABCDE1234F',
      aadharNumber: '1234 5678 9012',
      bankAccount: {
        accountNumber: '1234567890',
        routingNumber: 'SBIN0001234',
        bankName: 'State Bank of India',
        accountHolderName: 'John Doe',
        accountType: 'savings'
      },
      documents: {
        panCard: 'pan_card_123.pdf',
        bankStatement: 'bank_statement_123.pdf'
      }
    };

    // Update ambassador with KYC data
    const { error: updateError } = await supabase
      .from('ambassadors')
      .update({
        payout_details: {
          ...mockKYCData,
          verified: false,
          submittedAt: new Date().toISOString(),
          status: 'pending_verification'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', ambassador.id);

    if (updateError) {
      console.log('❌ Error updating KYC data:', updateError.message);
      return;
    }

    console.log('\n✅ KYC data submitted successfully!');
    console.log('Status: pending_verification');

    // 4. Simulate admin approval
    console.log('\n🔍 Simulating admin review...');
    
    const { error: approvalError } = await supabase
      .from('ambassadors')
      .update({
        payout_details: {
          ...mockKYCData,
          verified: true,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          reviewedBy: 'admin-user-id',
          reviewedAt: new Date().toISOString()
        },
        reviewed_at: new Date().toISOString(),
        review_notes: 'KYC approved - test script',
        updated_at: new Date().toISOString()
      })
      .eq('id', ambassador.id);

    if (approvalError) {
      console.log('❌ Error approving KYC:', approvalError.message);
      return;
    }

    console.log('✅ KYC approved successfully!');

    // 5. Verify final status
    const { data: updatedAmbassador, error: fetchError } = await supabase
      .from('ambassadors')
      .select('*')
      .eq('id', ambassador.id)
      .single();

    if (fetchError) {
      console.log('❌ Error fetching updated ambassador:', fetchError.message);
      return;
    }

    console.log('\n📊 Final KYC Status:');
    console.log(`Status: ${updatedAmbassador.payout_details?.status}`);
    console.log(`Verified: ${updatedAmbassador.payout_details?.verified}`);
    console.log(`Verified At: ${updatedAmbassador.payout_details?.verifiedAt}`);

    console.log('\n🎉 KYC flow test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Login as the ambassador');
    console.log('3. Visit /ambassador/dashboard to see KYC status');
    console.log('4. Try requesting a payout (should work now)');
    console.log('5. Visit /admin/kyc as an admin to manage KYC submissions');

  } catch (error) {
    console.error('❌ Error in KYC test:', error.message);
  }
}

// Run the test
testKYCFlow();