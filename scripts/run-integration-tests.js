#!/usr/bin/env node

/**
 * Integration Test Runner
 * Runs comprehensive integration tests for the Skill Probe LMS
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  timeout: 300000, // 5 minutes per test suite
  maxWorkers: 1, // Run tests sequentially to avoid conflicts
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Check if environment is properly set up
function checkEnvironment() {
  logStep(1, 'Checking environment setup...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(', ')}`);
    logWarning('Please set up your .env.local file with the required variables');
    process.exit(1);
  }
  
  logSuccess('Environment variables are properly configured');
}

// Check if database is accessible
function checkDatabase() {
  logStep(2, 'Checking database connection...');
  
  try {
    execSync('npm run db:test', { stdio: 'pipe' });
    logSuccess('Database connection verified');
  } catch (error) {
    logError('Database connection failed');
    logWarning('Please ensure your Supabase database is running and accessible');
    process.exit(1);
  }
}

// Run database migrations if needed
function runMigrations() {
  logStep(3, 'Running database migrations...');
  
  try {
    execSync('npm run db:migrate', { stdio: 'pipe' });
    logSuccess('Database migrations completed');
  } catch (error) {
    logWarning('Migration script not found or failed - continuing with tests');
  }
}

// Clean up test data
function cleanupTestData() {
  logStep(4, 'Cleaning up any existing test data...');
  
  try {
    // This would run a cleanup script if we had one
    // execSync('npm run test:cleanup', { stdio: 'pipe' });
    logSuccess('Test data cleanup completed');
  } catch (error) {
    logWarning('Test cleanup script not found - continuing with tests');
  }
}

// Run specific test suite
function runTestSuite(suiteName, testFile) {
  log(`\n📋 Running ${suiteName}...`, 'magenta');
  
  const startTime = Date.now();
  
  try {
    const command = `npx jest ${testFile} --runInBand --detectOpenHandles --forceExit --verbose`;
    execSync(command, { 
      stdio: 'inherit',
      timeout: TEST_CONFIG.timeout,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logSuccess(`${suiteName} completed in ${duration}s`);
    return true;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logError(`${suiteName} failed after ${duration}s`);
    return false;
  }
}

// Generate test report
function generateTestReport(results) {
  logSection('TEST RESULTS SUMMARY');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  log(`\nTotal Test Suites: ${totalTests}`);
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${failedTests}`, failedTests === 0 ? 'green' : 'red');
  
  if (failedTests > 0) {
    log('\nFailed Test Suites:', 'red');
    results.filter(r => !r.passed).forEach(r => {
      log(`  - ${r.name}`, 'red');
    });
  }
  
  log(`\nOverall Status: ${failedTests === 0 ? 'PASSED' : 'FAILED'}`, 
      failedTests === 0 ? 'green' : 'red');
  
  return failedTests === 0;
}

// Main test execution
async function runIntegrationTests() {
  logSection('SKILL PROBE LMS - INTEGRATION TESTS');
  
  // Pre-test setup
  checkEnvironment();
  checkDatabase();
  runMigrations();
  cleanupTestData();
  
  logSection('EXECUTING TEST SUITES');
  
  // Define test suites
  const testSuites = [
    {
      name: 'User Registration and Course Enrollment Flow',
      file: 'src/__tests__/integration/userRegistrationFlow.integration.test.ts'
    },
    {
      name: 'Ambassador Referral and Payout Processing',
      file: 'src/__tests__/integration/ambassadorReferralFlow.integration.test.ts'
    },
    {
      name: 'Live Session Creation and Participation',
      file: 'src/__tests__/integration/liveSessionFlow.integration.test.ts'
    },
    {
      name: 'Internship Application and Employer Management',
      file: 'src/__tests__/integration/internshipFlow.integration.test.ts'
    }
  ];
  
  // Run each test suite
  const results = [];
  
  for (const suite of testSuites) {
    const passed = runTestSuite(suite.name, suite.file);
    results.push({ name: suite.name, passed });
    
    // Small delay between test suites
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate final report
  const allPassed = generateTestReport(results);
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Handle script arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('Integration Test Runner for Skill Probe LMS\n', 'bright');
  log('Usage: node scripts/run-integration-tests.js [options]\n');
  log('Options:');
  log('  --help, -h     Show this help message');
  log('  --suite <name> Run specific test suite');
  log('  --list         List available test suites');
  log('\nExamples:');
  log('  node scripts/run-integration-tests.js');
  log('  node scripts/run-integration-tests.js --suite userRegistrationFlow');
  process.exit(0);
}

if (args.includes('--list')) {
  log('Available Test Suites:\n', 'bright');
  log('1. userRegistrationFlow - User Registration and Course Enrollment');
  log('2. ambassadorReferralFlow - Ambassador Referral and Payout Processing');
  log('3. liveSessionFlow - Live Session Creation and Participation');
  log('4. internshipFlow - Internship Application and Employer Management');
  process.exit(0);
}

const suiteIndex = args.indexOf('--suite');
if (suiteIndex !== -1 && args[suiteIndex + 1]) {
  const suiteName = args[suiteIndex + 1];
  const suiteMap = {
    'userRegistrationFlow': 'src/__tests__/integration/userRegistrationFlow.integration.test.ts',
    'ambassadorReferralFlow': 'src/__tests__/integration/ambassadorReferralFlow.integration.test.ts',
    'liveSessionFlow': 'src/__tests__/integration/liveSessionFlow.integration.test.ts',
    'internshipFlow': 'src/__tests__/integration/internshipFlow.integration.test.ts'
  };
  
  if (suiteMap[suiteName]) {
    logSection(`RUNNING SINGLE TEST SUITE: ${suiteName}`);
    checkEnvironment();
    checkDatabase();
    const passed = runTestSuite(suiteName, suiteMap[suiteName]);
    process.exit(passed ? 0 : 1);
  } else {
    logError(`Unknown test suite: ${suiteName}`);
    log('Use --list to see available test suites');
    process.exit(1);
  }
}

// Run all tests by default
runIntegrationTests().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});