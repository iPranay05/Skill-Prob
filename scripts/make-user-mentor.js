const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserMentor() {
  try {
    const email = 'pranaynairgenai@gmail.com'; // Your email from JWT token
    
    console.log('🔍 Finding user:', email);
    
    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, profile')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return;
    }

    console.log('👤 Current user:');
    console.log('   Email:', user.email);
    console.log('   Current Role:', user.role);
    console.log('   Name:', user.profile?.firstName, user.profile?.lastName);

    if (user.role === 'mentor') {
      console.log('✅ User is already a mentor!');
      return;
    }

    // Update user role to mentor
    console.log('🔄 Updating user role to mentor...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'mentor' })
      .eq('email', email);

    if (updateError) {
      console.error('❌ Error updating user role:', updateError);
      return;
    }

    console.log('✅ User role updated successfully!');
    console.log('\n🎉 SUCCESS! User is now a mentor.');
    console.log('\n📋 Next steps:');
    console.log('1. Logout from the application');
    console.log('2. Login again to get new JWT token with mentor role');
    console.log('3. Try creating live sessions - it should work now!');

  } catch (error) {
    console.error('❌ Error making user mentor:', error);
  }
}

makeUserMentor().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});