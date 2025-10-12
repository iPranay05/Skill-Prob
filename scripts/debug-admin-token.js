const jwt = require('jsonwebtoken');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function debugAdminToken() {
  try {
    console.log('Debugging admin token...');
    
    // Login as admin
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      
      console.log('Full login response:', JSON.stringify(loginData, null, 2));
      
      const accessToken = loginData.data?.accessToken || loginData.accessToken || loginData.data?.tokens?.accessToken;
      console.log('Access token:', accessToken);
      
      // Decode the token to see its contents
      const decoded = jwt.decode(accessToken);
      console.log('Decoded token:', JSON.stringify(decoded, null, 2));
      
      // Test the token with admin API
      console.log('\nTesting token with admin API...');
      const usersResponse = await fetch(`${baseUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('Admin API response status:', usersResponse.status);
      const responseText = await usersResponse.text();
      console.log('Admin API response:', responseText);
      
    } else {
      const errorText = await loginResponse.text();
      console.error('Login failed:', errorText);
    }
    
  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugAdminToken();