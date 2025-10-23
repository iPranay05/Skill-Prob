const { google } = require('googleapis');
const readline = require('readline');

// Required scopes for Google Calendar and Meet
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

async function generateRefreshToken() {
  // Get credentials from environment or prompt
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

  if (!clientId || !clientSecret) {
    console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables');
    console.log('Please set these in your .env file:');
    console.log('GOOGLE_CLIENT_ID=your_client_id');
    console.log('GOOGLE_CLIENT_SECRET=your_client_secret');
    console.log('GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Generate the URL for user authorization
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent screen to get refresh token
  });

  console.log('🔐 Google OAuth Setup for Meet Integration');
  console.log('==========================================');
  console.log('');
  console.log('1. Open this URL in your browser:');
  console.log('');
  console.log(authUrl);
  console.log('');
  console.log('2. Complete the authorization process');
  console.log('3. Copy the authorization code from the callback URL');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the authorization code: ', async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('');
      console.log('✅ Success! Here are your tokens:');
      console.log('================================');
      console.log('');
      console.log('Add these to your .env file:');
      console.log('');
      console.log(`GOOGLE_CLIENT_ID=${clientId}`);
      console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
      console.log(`GOOGLE_REDIRECT_URI=${redirectUri}`);
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('');
      
      if (tokens.refresh_token) {
        console.log('🎉 Refresh token generated successfully!');
        console.log('Your Google Meet integration should now work.');
      } else {
        console.log('⚠️  No refresh token received. This might happen if:');
        console.log('   - You\'ve already authorized this app before');
        console.log('   - Try revoking access at https://myaccount.google.com/permissions');
        console.log('   - Then run this script again');
      }
      
    } catch (error) {
      console.error('❌ Error getting tokens:', error.message);
    }
    
    rl.close();
  });
}

// Test existing refresh token
async function testRefreshToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!refreshToken) {
    console.log('❌ No GOOGLE_REFRESH_TOKEN found in environment');
    return false;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('✅ Refresh token is valid!');
    console.log('Access token expires at:', new Date(credentials.expiry_date));
    return true;
  } catch (error) {
    console.log('❌ Refresh token is invalid:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🔍 Testing existing refresh token...');
  const isValid = await testRefreshToken();
  
  if (!isValid) {
    console.log('');
    console.log('🔄 Generating new refresh token...');
    await generateRefreshToken();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateRefreshToken, testRefreshToken };