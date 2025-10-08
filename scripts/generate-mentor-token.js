const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET;

if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateMentorToken() {
  try {
    console.log('🔍 Finding mentor user...');

    // Find the mentor we created
    const { data: mentor, error } = await supabase
      .from('users')
      .select('id, email, role, profile')
      .eq('email', 'mentor@skillprobe.com')
      .single();

    if (error || !mentor) {
      console.error('❌ Mentor not found:', error);
      return;
    }

    console.log(`✅ Found mentor: ${mentor.email}`);

    // Generate JWT token
    const payload = {
      userId: mentor.id,
      email: mentor.email,
      role: mentor.role,
      profile: mentor.profile
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

    console.log('\n🎯 Generated Access Token:');
    console.log('Copy this token and use it in your browser:');
    console.log('\n' + '='.repeat(80));
    console.log(token);
    console.log('='.repeat(80));

    console.log('\n📋 To use this token:');
    console.log('1. Open your browser developer tools (F12)');
    console.log('2. Go to Application/Storage > Local Storage');
    console.log('3. Add a new item:');
    console.log('   Key: accessToken');
    console.log('   Value: (paste the token above)');
    console.log('4. Refresh the page');
    console.log('5. You should now be logged in as a mentor');

    console.log('\n⏰ Token expires in 24 hours');

  } catch (error) {
    console.error('❌ Error generating token:', error);
  }
}

generateMentorToken().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});