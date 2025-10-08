# Debug OTP Verification Issue

## Problem
The verify-otp API is still showing the old error message expecting `userId`, `type`, `code` instead of the new format `email`, `emailOTP`, `phoneOTP`.

## Possible Causes
1. **Server caching** - Development server hasn't picked up the changes
2. **Build cache** - Next.js has cached the old version
3. **Browser cache** - Frontend is cached

## Debug Steps

### 1. Test New Endpoint
Visit in browser or use curl:
```
POST http://localhost:3000/api/test-otp
Body: {"test": "data"}
```

Should return success with timestamp showing server has latest code.

### 2. Check Console Logs
When submitting OTP verification, check console for:
```
Received OTP verification data: { email: "...", emailOTP: "...", phoneOTP: "..." }
```

### 3. Restart Development Server
If still getting old errors:
1. Stop the dev server (Ctrl+C)
2. Clear Next.js cache: `rm -rf .next`
3. Restart: `npm run dev`

### 4. Test OTP Verification
1. Register a new user
2. Note the OTP codes from console
3. Go to verify-otp page
4. Enter the codes and submit
5. Check console logs

## Expected Flow
1. Frontend sends: `{email: "user@example.com", emailOTP: "123456", phoneOTP: "654321"}`
2. API logs: `Received OTP verification data: {...}`
3. API validates email and emailOTP are present
4. API finds user by email
5. API verifies OTP codes
6. Success response returned

## If Still Failing
The issue might be that there are multiple verify-otp routes or the server is running an old cached version.