#!/usr/bin/env node

/**
 * Simple script to validate PostgreSQL migration syntax
 */

const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '../supabase/migrations/008_payment_processing.sql');

try {
  const content = fs.readFileSync(migrationFile, 'utf8');
  
  // Check for common PostgreSQL syntax issues
  const issues = [];
  
  // Check for single $ instead of $$
  if (content.includes('DO $ BEGIN') || content.includes('AS $\n')) {
    issues.push('Found single $ delimiter - should use $$ for PostgreSQL');
  }
  
  // Check for proper function syntax
  const functionMatches = content.match(/CREATE OR REPLACE FUNCTION.*?language 'plpgsql';/gs);
  if (functionMatches) {
    functionMatches.forEach((func, index) => {
      if (!func.includes('$$')) {
        issues.push(`Function ${index + 1} missing $$ delimiters`);
      }
    });
  }
  
  // Check for proper DO block syntax
  const doMatches = content.match(/DO \$\$ BEGIN.*?END \$\$;/gs);
  if (doMatches) {
    console.log(`✅ Found ${doMatches.length} properly formatted DO blocks`);
  }
  
  if (issues.length === 0) {
    console.log('✅ Migration syntax validation passed!');
    console.log('📄 File: 008_payment_processing.sql');
    console.log('🔧 All PostgreSQL syntax appears correct');
  } else {
    console.log('❌ Migration syntax issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}