const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initializeSystemConfigs() {
  try {
    console.log('Initializing default system configurations...');
    
    // Call the function to initialize default configs
    const { data, error } = await supabase.rpc('initialize_default_system_configs');
    
    if (error) {
      console.error('Error initializing system configs:', error);
      process.exit(1);
    }
    
    console.log('✅ Default system configurations initialized successfully');
    
    // Verify the configurations were created
    const { data: configs, error: configError } = await supabase
      .from('system_configs')
      .select('key, category, description');
    
    if (configError) {
      console.error('Error fetching configs:', configError);
    } else {
      console.log('\n📋 System configurations:');
      configs.forEach(config => {
        console.log(`  - ${config.key} (${config.category}): ${config.description}`);
      });
    }
    
    // Verify feature flags were created
    const { data: flags, error: flagError } = await supabase
      .from('feature_flags')
      .select('name, description, enabled');
    
    if (flagError) {
      console.error('Error fetching feature flags:', flagError);
    } else {
      console.log('\n🚩 Feature flags:');
      flags.forEach(flag => {
        console.log(`  - ${flag.name}: ${flag.enabled ? '✅' : '❌'} - ${flag.description}`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeSystemConfigs();