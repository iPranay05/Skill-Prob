const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testAdminUsersAPI() {
  try {
    console.log('Testing Admin Users API...');
    
    // First, let's try to login as admin to get a token
    console.log('1. Attempting admin login...');
    
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
    
    if (!loginResponse.ok) {
      console.log('Admin login failed, trying system user...');
      
      const systemLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'system@skillprobe.com',
          password: 'system123'
        })
      });
      
      if (!systemLoginResponse.ok) {
        console.error('System login also failed');
        const errorText = await systemLoginResponse.text();
        console.error('Error:', errorText);
        return;
      }
      
      const systemLoginData = await systemLoginResponse.json();
      console.log('✅ System login successful');
      
      // Test getting users
      console.log('2. Testing get users API...');
      
      const usersResponse = await fetch(`${baseUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${systemLoginData.data.accessToken}`
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Users API successful');
        console.log(`Found ${usersData.data.length} users`);
        
        // Show first few users
        usersData.data.slice(0, 3).forEach(user => {
          console.log(`- ${user.email} (${user.role}) - Status: ${user.status}`);
        });
        
        // Test suspending a user (find a non-admin user)
        const testUser = usersData.data.find(user => 
          user.role !== 'admin' && user.role !== 'super_admin' && user.status === 'active'
        );
        
        if (testUser) {
          console.log(`3. Testing suspend user: ${testUser.email}...`);
          
          const suspendResponse = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${systemLoginData.data.accessToken}`
            },
            body: JSON.stringify({
              action: 'suspend'
            })
          });
          
          if (suspendResponse.ok) {
            const suspendData = await suspendResponse.json();
            console.log('✅ Suspend API successful:', suspendData.data.message);
            
            // Test activating the user back
            console.log(`4. Testing activate user: ${testUser.email}...`);
            
            const activateResponse = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${systemLoginData.data.accessToken}`
              },
              body: JSON.stringify({
                action: 'activate'
              })
            });
            
            if (activateResponse.ok) {
              const activateData = await activateResponse.json();
              console.log('✅ Activate API successful:', activateData.data.message);
            } else {
              const activateError = await activateResponse.text();
              console.error('❌ Activate API failed:', activateError);
            }
            
          } else {
            const suspendError = await suspendResponse.text();
            console.error('❌ Suspend API failed:', suspendError);
          }
        } else {
          console.log('No suitable test user found for suspend/activate test');
        }
        
      } else {
        const usersError = await usersResponse.text();
        console.error('❌ Users API failed:', usersError);
      }
      
    } else {
      const adminLoginData = await loginResponse.json();
      console.log('✅ Admin login successful');
      
      // Test getting users
      console.log('2. Testing get users API...');
      
      const usersResponse = await fetch(`${baseUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${adminLoginData.data.tokens.accessToken}`
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Users API successful');
        console.log(`Found ${usersData.data.length} users`);
        
        // Show first few users
        usersData.data.slice(0, 3).forEach(user => {
          console.log(`- ${user.email} (${user.role}) - Status: ${user.status}`);
        });
        
        // Test suspending a user (find a non-admin user)
        const testUser = usersData.data.find(user => 
          user.role !== 'admin' && user.role !== 'super_admin' && user.status === 'active'
        );
        
        if (testUser) {
          console.log(`3. Testing suspend user: ${testUser.email}...`);
          
          const suspendResponse = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminLoginData.data.tokens.accessToken}`
            },
            body: JSON.stringify({
              action: 'suspend'
            })
          });
          
          if (suspendResponse.ok) {
            const suspendData = await suspendResponse.json();
            console.log('✅ Suspend API successful:', suspendData.data.message);
            
            // Test activating the user back
            console.log(`4. Testing activate user: ${testUser.email}...`);
            
            const activateResponse = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminLoginData.data.tokens.accessToken}`
              },
              body: JSON.stringify({
                action: 'activate'
              })
            });
            
            if (activateResponse.ok) {
              const activateData = await activateResponse.json();
              console.log('✅ Activate API successful:', activateData.data.message);
            } else {
              const activateError = await activateResponse.text();
              console.error('❌ Activate API failed:', activateError);
            }
            
          } else {
            const suspendError = await suspendResponse.text();
            console.error('❌ Suspend API failed:', suspendError);
          }
        } else {
          console.log('No suitable test user found for suspend/activate test');
        }
        
      } else {
        const usersError = await usersResponse.text();
        console.error('❌ Users API failed:', usersError);
      }
    }
    
  } catch (error) {
    console.error('Test script error:', error);
  }
}

testAdminUsersAPI();