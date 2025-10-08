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

async function createMentorLogin() {
  try {
    console.log('🔐 Creating mentor with proper login credentials...');

    // Hash the password properly
    const password = 'mentor123'; // Simple password for demo
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if mentor already exists
    const { data: existingMentor } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'mentor@skillprobe.com')
      .single();

    if (existingMentor) {
      // Update existing mentor with proper password
      console.log('📝 Updating existing mentor with proper password...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('email', 'mentor@skillprobe.com');

      if (updateError) {
        console.error('Error updating mentor:', updateError);
        return;
      }

      console.log('✅ Updated mentor password successfully!');
    } else {
      // Create new mentor
      console.log('👨‍🏫 Creating new mentor user...');
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: 'mentor@skillprobe.com',
          password: hashedPassword,
          role: 'mentor',
          profile: {
            firstName: 'John',
            lastName: 'Mentor',
            bio: 'Experienced instructor with 10+ years in tech education',
            expertise: ['Web Development', 'Data Science', 'Digital Marketing'],
            socialLinks: {
              linkedin: 'https://linkedin.com/in/johnmentor',
              twitter: 'https://twitter.com/johnmentor'
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
        console.error('Error creating mentor:', createUserError);
        return;
      }

      console.log('✅ Created mentor successfully!');
    }

    console.log('\n🎯 Mentor Login Credentials:');
    console.log('='.repeat(40));
    console.log('Email: mentor@skillprobe.com');
    console.log('Password: mentor123');
    console.log('='.repeat(40));
    console.log('\n📋 How to login:');
    console.log('1. Go to http://localhost:3000/auth/login');
    console.log('2. Enter the credentials above');
    console.log('3. You\'ll be redirected to mentor dashboard');
    console.log('4. You can then create live sessions!');

  } catch (error) {
    console.error('❌ Error creating mentor login:', error);
  }
}

createMentorLogin().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});