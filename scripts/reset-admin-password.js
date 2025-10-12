const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    
    const email = 'admin@test.com';
    const newPassword = 'admin123';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the user's password
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();
    
    if (error) {
      console.error('Error updating password:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Password updated successfully for:', email);
      console.log('New password:', newPassword);
      console.log('User role:', data[0].role);
    } else {
      console.log('❌ User not found:', email);
    }
    
    // Also reset system admin password
    const systemEmail = 'system@skillprobe.com';
    const systemPassword = 'system123';
    const systemHashedPassword = await bcrypt.hash(systemPassword, 12);
    
    const { data: systemData, error: systemError } = await supabase
      .from('users')
      .update({ 
        password: systemHashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', systemEmail)
      .select();
    
    if (systemError) {
      console.error('Error updating system password:', systemError);
    } else if (systemData && systemData.length > 0) {
      console.log('✅ System password updated successfully for:', systemEmail);
      console.log('System password:', systemPassword);
      console.log('System role:', systemData[0].role);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

resetAdminPassword();