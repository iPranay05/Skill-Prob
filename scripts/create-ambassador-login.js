const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAmbassadorLogin() {
  try {
    console.log('🔐 Creating ambassador with proper login credentials...');

    // Hash the password properly
    const password = 'ambassador123'; // Simple password for demo
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if ambassador already exists
    const { data: existingAmbassador } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'ambassador@skillprobe.com')
      .single();

    let userId;

    if (existingAmbassador) {
      // Update existing ambassador with proper password
      console.log('📝 Updating existing ambassador with proper password...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword,
          role: 'ambassador' // Make sure role is set
        })
        .eq('email', 'ambassador@skillprobe.com');

      if (updateError) {
        console.error('Error updating ambassador:', updateError);
        return;
      }

      userId = existingAmbassador.id;
      console.log('✅ Updated ambassador password successfully!');
    } else {
      // Create new ambassador
      console.log('🤝 Creating new ambassador user...');
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: 'ambassador@skillprobe.com',
          password: hashedPassword,
          role: 'ambassador',
          profile: {
            firstName: 'Sarah',
            lastName: 'Ambassador',
            bio: 'Passionate about education and helping others learn',
            socialLinks: {
              linkedin: 'https://linkedin.com/in/sarahambassador',
              twitter: 'https://twitter.com/sarahambassador',
              instagram: 'https://instagram.com/sarahambassador'
            }
          },
          verification: {
            emailVerified: true,
            phoneVerified: false,
            kycStatus: 'approved'
          }
        })
        .select()
        .single();

      if (createUserError) {
        console.error('Error creating ambassador:', createUserError);
        return;
      }

      userId = newUser.id;
      console.log('✅ Created ambassador user successfully!');
    }

    // Check if ambassador profile exists
    const { data: existingProfile } = await supabase
      .from('ambassadors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existingProfile) {
      // Generate referral code
      const referralCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create ambassador profile
      console.log('📋 Creating ambassador profile...');
      const { error: profileError } = await supabase
        .from('ambassadors')
        .insert({
          user_id: userId,
          referral_code: referralCode,
          status: 'active',
          application: {
            motivation: 'I want to help others discover great learning opportunities',
            socialMedia: [
              { platform: 'Instagram', handle: '@sarahambassador', followers: 5000 },
              { platform: 'Twitter', handle: '@sarahambassador', followers: 2500 }
            ],
            experience: 'I have been promoting educational content for 2 years'
          },
          performance: {
            totalReferrals: 15,
            successfulConversions: 8,
            totalEarnings: 2400,
            currentPoints: 150,
            lifetimePoints: 300
          },
          payout_details: { verified: false }
        });

      if (profileError) {
        console.error('Error creating ambassador profile:', profileError);
        return;
      }

      // Create wallet for ambassador
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          user_type: 'ambassador',
          balance: {
            points: 150,
            credits: 0,
            currency: 'INR'
          },
          total_earned: 2400,
          total_spent: 0,
          total_withdrawn: 0
        });

      if (walletError) {
        console.error('Error creating wallet:', walletError);
        return;
      }

      console.log('✅ Created ambassador profile and wallet successfully!');
      console.log(`📝 Referral Code: ${referralCode}`);
    } else {
      console.log('✅ Ambassador profile already exists!');
    }

    console.log('\n🎯 Ambassador Login Credentials:');
    console.log('='.repeat(40));
    console.log('Email: ambassador@skillprobe.com');
    console.log('Password: ambassador123');
    console.log('='.repeat(40));
    console.log('\n📋 How to login:');
    console.log('1. Go to http://localhost:3000/auth/login');
    console.log('2. Enter the credentials above');
    console.log('3. You\'ll be redirected to ambassador dashboard');
    console.log('4. You can view analytics, send invitations, and download resources!');

  } catch (error) {
    console.error('❌ Error creating ambassador login:', error);
  }
}

createAmbassadorLogin().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});