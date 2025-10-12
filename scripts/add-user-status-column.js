const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addStatusColumn() {
  try {
    console.log('Adding status column to users table...');
    
    // First, let's check the current table structure
    console.log('Checking current users table structure...');
    
    const { data: currentUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking users table:', checkError);
      return;
    }
    
    console.log('Current user structure:', Object.keys(currentUsers[0] || {}));
    
    // Since we can't run DDL through the client, let's use a different approach
    // We'll update the users to have a status field in their profile JSONB
    console.log('Adding status to user profiles...');
    
    // Get all users
    const { data: allUsers, error: getUsersError } = await supabase
      .from('users')
      .select('id, profile');
    
    if (getUsersError) {
      console.error('Error getting users:', getUsersError);
      return;
    }
    
    console.log(`Found ${allUsers.length} users to update`);
    
    // Update each user to have status in their profile
    for (const user of allUsers) {
      const updatedProfile = {
        ...user.profile,
        status: 'active' // Default status
      };
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile: updatedProfile })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`Error updating user ${user.id}:`, updateError);
      }
    }
    
    console.log('✅ Successfully added status to all user profiles');
    
    // Test the update
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('id, email, profile')
      .limit(3);
    
    if (testError) {
      console.error('Test query failed:', testError);
    } else {
      console.log('✅ Test successful - users with status:');
      testUsers.forEach(user => {
        console.log(`- ${user.email}: status = ${user.profile?.status || 'not set'}`);
      });
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

addStatusColumn();