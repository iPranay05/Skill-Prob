#!/usr/bin/env node

/**
 * Development Server Restart Script
 * Cleans up and restarts the Next.js development server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Restarting development server...');

try {
  // Clean Next.js cache
  const nextCacheDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextCacheDir)) {
    console.log('🧹 Cleaning .next cache...');
    execSync('rmdir /s /q .next', { stdio: 'inherit' });
  }

  // Clean node_modules/.cache if it exists
  const nodeCacheDir = path.join(process.cwd(), 'node_modules', '.cache');
  if (fs.existsSync(nodeCacheDir)) {
    console.log('🧹 Cleaning node_modules cache...');
    execSync('rmdir /s /q node_modules\\.cache', { stdio: 'inherit' });
  }

  console.log('✅ Cache cleaned successfully');
  console.log('🚀 Starting development server...');
  
  // Start the development server
  execSync('npm run dev', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Error restarting server:', error.message);
  process.exit(1);
}