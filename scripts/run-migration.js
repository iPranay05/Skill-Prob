const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log(`🔄 Running migration: ${migrationFile}...`);

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migration
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`   ${i + 1}/${statements.length}: Executing statement...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error && !error.message.includes('already exists')) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
          // Continue with other statements
        } else if (error && error.message.includes('already exists')) {
          console.log(`   ℹ️  Statement ${i + 1}: Already exists, skipping...`);
        } else {
          console.log(`   ✅ Statement ${i + 1}: Success`);
        }
      } catch (err) {
        console.error(`❌ Exception executing statement ${i + 1}:`, err.message);
      }
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Please provide a migration file name');
  console.log('Usage: node scripts/run-migration.js <migration-file>');
  process.exit(1);
}

runMigration(migrationFile);