const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔄 Testing Supabase connection...');

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    return false;
  }

  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    return false;
  }

  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
    return false;
  }

  try {
    // Test with anon key
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const { error: anonError } = await supabaseAnon.from('users').select('count').limit(1);
    
    if (anonError && !anonError.message.includes('relation "users" does not exist')) {
      console.error('❌ Anon key connection failed:', anonError.message);
      return false;
    }

    // Test with service role key
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { error: serviceError } = await supabaseService.from('users').select('count').limit(1);
    
    if (serviceError && !serviceError.message.includes('relation "users" does not exist')) {
      console.error('❌ Service role connection failed:', serviceError.message);
      return false;
    }

    console.log('✅ Supabase connection successful!');
    
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabaseService
      .rpc('exec_sql', { sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'otp_verifications', 'password_resets');" })
      .catch(() => ({ data: null, error: null }));

    if (tables && tables.length > 0) {
      console.log('✅ Database tables found');
    } else {
      console.log('⚠️  Database tables not found. Run: npm run db:setup');
    }

    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  testConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testConnection };