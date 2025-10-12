const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

async function runMigration() {
  try {
    console.log('Running migration 022: Add user status column...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '022_add_user_status_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration 022 completed successfully!');
    
    // Verify the migration by checking if the status column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('column_name', 'status');
    
    if (columnError) {
      console.error('Error verifying migration:', columnError);
    } else if (columns && columns.length > 0) {
      console.log('✅ Status column successfully added to users table');
    } else {
      console.log('⚠️  Status column not found - migration may not have applied correctly');
    }
    
    // Test the new functionality by checking current users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, status')
      .limit(5);
    
    if (usersError) {
      console.error('Error testing users query:', usersError);
    } else {
      console.log('✅ Users table query successful');
      console.log('Sample users with status:', users);
    }
    
  } catch (error) {
    console.error('Migration script error:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function runMigrationDirect() {
  try {
    console.log('Running migration 022 directly...');
    
    // Create user status enum
    const { error: enumError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ BEGIN
            CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending', 'deleted');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `
    });
    
    if (enumError) {
      console.log('Enum creation result:', enumError.message);
    }
    
    // Add status column
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active';`
    });
    
    if (columnError) {
      console.log('Column addition result:', columnError.message);
    }
    
    // Add last_login_at column
    const { error: loginError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;`
    });
    
    if (loginError) {
      console.log('Last login column result:', loginError.message);
    }
    
    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
        CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);
      `
    });
    
    if (indexError) {
      console.log('Index creation result:', indexError.message);
    }
    
    // Update existing users
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `UPDATE users SET status = 'active' WHERE status IS NULL;`
    });
    
    if (updateError) {
      console.log('Update existing users result:', updateError.message);
    }
    
    console.log('✅ Migration completed!');
    
    // Test the migration
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('id, email, status, last_login_at')
      .limit(3);
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
    } else {
      console.log('✅ Test query successful:');
      console.table(testUsers);
    }
    
  } catch (error) {
    console.error('Direct migration error:', error);
  }
}

// Run the migration
if (process.argv.includes('--direct')) {
  runMigrationDirect();
} else {
  runMigration();
}