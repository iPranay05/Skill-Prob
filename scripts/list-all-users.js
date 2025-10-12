const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllUsers() {
  try {
    console.log('📋 Fetching all users from database...\n');

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, profile, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }

    console.log(`✅ Found ${users.length} users:\n`);
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.profile?.firstName || 'N/A'} ${user.profile?.lastName || 'N/A'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log(`   ID: ${user.id}`);
      console.log('-'.repeat(40));
    });

    console.log('\n🔑 Test Credentials (if they exist):');
    console.log('Student: student@skillprobe.com / student123');
    console.log('Mentor: mentor@skillprobe.com / mentor123');
    console.log('Ambassador: ambassador@skillprobe.com / ambassador123');

  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

listAllUsers().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});