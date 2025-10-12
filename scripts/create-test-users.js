const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
  console.log('🚀 Creating test users for all roles...\n');

  const testUsers = [
    {
      email: 'student@test.com',
      password: 'test123',
      role: 'student',
      firstName: 'Test',
      lastName: 'Student'
    },
    {
      email: 'mentor@test.com',
      password: 'test123',
      role: 'mentor',
      firstName: 'Test',
      lastName: 'Mentor'
    },
    {
      email: 'ambassador@test.com',
      password: 'test123',
      role: 'ambassador',
      firstName: 'Test',
      lastName: 'Ambassador'
    },
    {
      email: 'employer@test.com',
      password: 'test123',
      role: 'employer',
      firstName: 'Test',
      lastName: 'Employer'
    },
    {
      email: 'admin@test.com',
      password: 'test123',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Admin'
    }
  ];

  for (const userData of testUsers) {
    try {
      console.log(`Creating ${userData.role}: ${userData.email}`);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        console.log(`  ✅ User already exists, updating role to ${userData.role}`);
        
        // Update role if different
        if (existingUser.role !== userData.role) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: userData.role })
            .eq('id', existingUser.id);

          if (updateError) {
            console.log(`  ❌ Error updating role:`, updateError.message);
          } else {
            console.log(`  ✅ Role updated to ${userData.role}`);
          }
        }
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          profile: {
            firstName: userData.firstName,
            lastName: userData.lastName
          },
          verification: {
            emailVerified: true,
            phoneVerified: false,
            kycStatus: 'approved'
          },
          preferences: {
            notifications: {
              email: true,
              sms: false,
              push: true
            }
          }
        })
        .select()
        .single();

      if (createError) {
        console.log(`  ❌ Error creating user:`, createError.message);
        continue;
      }

      console.log(`  ✅ Created user: ${newUser.id}`);

      // Create ambassador record if role is ambassador
      if (userData.role === 'ambassador') {
        const referralCode = `AMB${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const { error: ambassadorError } = await supabase
          .from('ambassadors')
          .insert({
            user_id: newUser.id,
            referral_code: referralCode,
            status: 'active',
            performance: {
              totalReferrals: 0,
              successfulConversions: 0,
              totalEarnings: 0,
              currentPoints: 0
            }
          });

        if (ambassadorError) {
          console.log(`  ⚠️ Error creating ambassador record:`, ambassadorError.message);
        } else {
          console.log(`  ✅ Created ambassador record with code: ${referralCode}`);
        }
      }

    } catch (error) {
      console.log(`  ❌ Error processing ${userData.email}:`, error.message);
    }
  }

  console.log('\n🎉 Test user creation completed!');
  console.log('\nTest Credentials:');
  testUsers.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
}

createTestUsers().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});