const { google } = require('googleapis');
const readline = require('readline');

// Load your credentials from .env.local
require('dotenv').config({ path: '.env.local' });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate the URL for user authorization
const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // This is important for getting refresh token
  scope: scopes,
  prompt: 'consent' // Force consent screen to get refresh token
});

console.log('🔧 Using YOUR OAuth credentials:');
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

console.log('\n🔗 Open this URL in your browser:');
console.log(authUrl);
console.log('\n📋 After authorization, you\'ll be redirected to a URL.');
console.log('Copy the "code" parameter from that URL and paste it here.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✅ Success! Here are your tokens:');
    console.log('\n📝 Add this to your .env.local:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    
    if (tokens.access_token) {
      console.log(`\n🔑 Access Token (expires in 1 hour): ${tokens.access_token}`);
    }
    
  } catch (error) {
    console.error('❌ Error getting tokens:', error.message);
  }
  
  rl.close();
});