const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testSimpleAPI() {
  try {
    console.log('Testing basic API connectivity...');
    console.log('Base URL:', baseUrl);
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Health endpoint working:', healthData);
      } else {
        console.log('❌ Health endpoint failed:', healthResponse.status);
      }
    } catch (error) {
      console.log('❌ Health endpoint error:', error.message);
    }
    
    // Test if we can reach the admin users endpoint without auth (should get 401)
    console.log('2. Testing admin users endpoint (should get 401)...');
    try {
      const usersResponse = await fetch(`${baseUrl}/api/admin/users`);
      console.log('Admin users response status:', usersResponse.status);
      const responseText = await usersResponse.text();
      console.log('Response:', responseText);
    } catch (error) {
      console.log('❌ Admin users endpoint error:', error.message);
    }
    
    // Test login endpoint with a known user
    console.log('3. Testing login endpoint...');
    try {
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'student@test.com',
          password: 'student123'
        })
      });
      
      console.log('Login response status:', loginResponse.status);
      const loginText = await loginResponse.text();
      console.log('Login response:', loginText);
      
    } catch (error) {
      console.log('❌ Login endpoint error:', error.message);
    }
    
  } catch (error) {
    console.error('Test script error:', error);
  }
}

testSimpleAPI();