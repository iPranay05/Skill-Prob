#!/usr/bin/env node

/**
 * Performance Testing Script
 * Tests API endpoints and database queries for performance bottlenecks
 */

const { performance } = require('perf_hooks');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  concurrentUsers: 10,
  testDuration: 30000, // 30 seconds
  endpoints: [
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/courses', method: 'GET', name: 'Course List' },
    { path: '/api/jobs', method: 'GET', name: 'Job List' },
    { path: '/api/auth/refresh', method: 'POST', name: 'Token Refresh', requiresAuth: true }
  ],
  thresholds: {
    responseTime: 2000, // 2 seconds
    errorRate: 0.05, // 5%
    throughput: 10 // requests per second
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      reject({
        error: error.message,
        responseTime,
        success: false
      });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Load test for a single endpoint
async function loadTestEndpoint(endpoint, duration = 30000) {
  log(`\n🔄 Load testing: ${endpoint.name}`, 'blue');
  
  const results = [];
  const startTime = Date.now();
  const endTime = startTime + duration;
  
  // Create concurrent users
  const userPromises = [];
  
  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    const userPromise = (async () => {
      const userResults = [];
      
      while (Date.now() < endTime) {
        try {
          const url = `${CONFIG.baseUrl}${endpoint.path}`;
          const options = {
            method: endpoint.method
          };
          
          // Add auth header if required
          if (endpoint.requiresAuth) {
            options.headers = {
              'Authorization': 'Bearer test-token'
            };
          }
          
          // Add request body for POST requests
          if (endpoint.method === 'POST' && endpoint.path === '/api/auth/refresh') {
            options.body = {
              refreshToken: 'test-refresh-token'
            };
          }
          
          const result = await makeRequest(url, options);
          userResults.push(result);
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          userResults.push({
            success: false,
            responseTime: 0,
            error: error.message || 'Unknown error'
          });
        }
      }
      
      return userResults;
    })();
    
    userPromises.push(userPromise);
  }
  
  // Wait for all users to complete
  const allUserResults = await Promise.all(userPromises);
  
  // Flatten results
  allUserResults.forEach(userResults => {
    results.push(...userResults);
  });
  
  return analyzeResults(results, endpoint.name);
}

// Analyze test results
function analyzeResults(results, testName) {
  const totalRequests = results.length;
  const successfulRequests = results.filter(r => r.success).length;
  const failedRequests = totalRequests - successfulRequests;
  
  const responseTimes = results
    .filter(r => r.success)
    .map(r => r.responseTime);
  
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
  
  // Calculate percentiles
  const sortedTimes = responseTimes.sort((a, b) => a - b);
  const p95 = sortedTimes.length > 0 
    ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] 
    : 0;
  const p99 = sortedTimes.length > 0 
    ? sortedTimes[Math.floor(sortedTimes.length * 0.99)] 
    : 0;
  
  const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
  const throughput = totalRequests / (CONFIG.testDuration / 1000);
  
  const analysis = {
    testName,
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate,
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    p95ResponseTime: p95,
    p99ResponseTime: p99,
    throughput
  };
  
  // Print results
  log(`\n📊 Results for ${testName}:`, 'cyan');
  log(`   Total Requests: ${totalRequests}`);
  log(`   Successful: ${successfulRequests}`, successfulRequests === totalRequests ? 'green' : 'yellow');
  log(`   Failed: ${failedRequests}`, failedRequests === 0 ? 'green' : 'red');
  log(`   Error Rate: ${(errorRate * 100).toFixed(2)}%`, errorRate < CONFIG.thresholds.errorRate ? 'green' : 'red');
  log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`, avgResponseTime < CONFIG.thresholds.responseTime ? 'green' : 'red');
  log(`   Min Response Time: ${minResponseTime.toFixed(2)}ms`);
  log(`   Max Response Time: ${maxResponseTime.toFixed(2)}ms`);
  log(`   95th Percentile: ${p95.toFixed(2)}ms`);
  log(`   99th Percentile: ${p99.toFixed(2)}ms`);
  log(`   Throughput: ${throughput.toFixed(2)} req/s`, throughput > CONFIG.thresholds.throughput ? 'green' : 'red');
  
  return analysis;
}

// Database performance test
async function testDatabasePerformance() {
  log('\n🗄️  Testing Database Performance...', 'blue');
  
  try {
    // Test basic connection
    const startTime = performance.now();
    const healthResponse = await makeRequest(`${CONFIG.baseUrl}/api/health`);
    const connectionTime = performance.now() - startTime;
    
    log(`   Database Connection Time: ${connectionTime.toFixed(2)}ms`, 
        connectionTime < 500 ? 'green' : 'red');
    
    // Test complex queries (if we had specific endpoints for this)
    // This would test things like:
    // - Course search with filters
    // - User enrollment queries
    // - Ambassador analytics queries
    
    return {
      connectionTime,
      healthCheck: healthResponse.success
    };
    
  } catch (error) {
    log(`   Database test failed: ${error.message}`, 'red');
    return {
      connectionTime: 0,
      healthCheck: false,
      error: error.message
    };
  }
}

// Memory usage monitoring
function monitorMemoryUsage() {
  const usage = process.memoryUsage();
  
  log('\n💾 Memory Usage:', 'blue');
  log(`   RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
  log(`   Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  log(`   Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  log(`   External: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);
  
  return usage;
}

// Generate performance report
function generatePerformanceReport(results, dbResults, memoryUsage) {
  logSection('PERFORMANCE TEST SUMMARY');
  
  const passedTests = results.filter(r => 
    r.errorRate < CONFIG.thresholds.errorRate &&
    r.avgResponseTime < CONFIG.thresholds.responseTime &&
    r.throughput > CONFIG.thresholds.throughput
  ).length;
  
  const totalTests = results.length;
  
  log(`\nEndpoint Tests: ${passedTests}/${totalTests} passed`, 
      passedTests === totalTests ? 'green' : 'red');
  
  log(`Database Health: ${dbResults.healthCheck ? 'PASS' : 'FAIL'}`, 
      dbResults.healthCheck ? 'green' : 'red');
  
  // Performance recommendations
  log('\n📋 Performance Recommendations:', 'yellow');
  
  results.forEach(result => {
    if (result.avgResponseTime > CONFIG.thresholds.responseTime) {
      log(`   ⚠️  ${result.testName}: Consider optimizing response time (${result.avgResponseTime.toFixed(2)}ms)`);
    }
    
    if (result.errorRate > CONFIG.thresholds.errorRate) {
      log(`   ⚠️  ${result.testName}: High error rate detected (${(result.errorRate * 100).toFixed(2)}%)`);
    }
    
    if (result.throughput < CONFIG.thresholds.throughput) {
      log(`   ⚠️  ${result.testName}: Low throughput (${result.throughput.toFixed(2)} req/s)`);
    }
  });
  
  if (memoryUsage.heapUsed / 1024 / 1024 > 100) {
    log('   ⚠️  High memory usage detected - consider memory optimization');
  }
  
  return passedTests === totalTests && dbResults.healthCheck;
}

// Main performance test execution
async function runPerformanceTests() {
  logSection('SKILL PROBE LMS - PERFORMANCE TESTS');
  
  log(`🚀 Starting performance tests...`, 'bright');
  log(`   Base URL: ${CONFIG.baseUrl}`);
  log(`   Concurrent Users: ${CONFIG.concurrentUsers}`);
  log(`   Test Duration: ${CONFIG.testDuration / 1000}s per endpoint`);
  
  // Monitor initial memory usage
  const initialMemory = monitorMemoryUsage();
  
  // Test database performance
  const dbResults = await testDatabasePerformance();
  
  // Run load tests for each endpoint
  const results = [];
  
  for (const endpoint of CONFIG.endpoints) {
    try {
      const result = await loadTestEndpoint(endpoint, CONFIG.testDuration);
      results.push(result);
    } catch (error) {
      log(`❌ Failed to test ${endpoint.name}: ${error.message}`, 'red');
      results.push({
        testName: endpoint.name,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        errorRate: 1,
        avgResponseTime: 0,
        throughput: 0,
        error: error.message
      });
    }
  }
  
  // Monitor final memory usage
  const finalMemory = monitorMemoryUsage();
  
  // Generate report
  const allPassed = generatePerformanceReport(results, dbResults, finalMemory);
  
  // Save results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results,
    dbResults,
    memoryUsage: {
      initial: initialMemory,
      final: finalMemory
    }
  };
  
  require('fs').writeFileSync(
    'performance-test-results.json',
    JSON.stringify(reportData, null, 2)
  );
  
  log(`\n📄 Detailed results saved to: performance-test-results.json`, 'cyan');
  
  return allPassed;
}

// Handle script execution
if (require.main === module) {
  runPerformanceTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Performance test failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  runPerformanceTests,
  loadTestEndpoint,
  testDatabasePerformance
};