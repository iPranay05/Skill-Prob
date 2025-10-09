# 🔄 Restart Instructions

## The Fix Applied

✅ **Fixed API mapping**: Updated `/api/ambassadors/dashboard` to properly map `referral_code` from database to `referralCode` in response

✅ **Confirmed data exists**: Ambassador has referral code `REFTXVRIO` in database

## Next Steps

### 1. Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Clear Browser Cache
- Hard refresh the dashboard page (Ctrl+Shift+R)
- Or open in incognito/private mode

### 3. Check Dashboard
- Navigate to `/ambassador/dashboard`
- The referral code should now display: `REFTXVRIO`
- The referral link should be: `http://localhost:3000/r/REFTXVRIO`

## What Was Wrong

The issue was a **field name mismatch**:
- **Database**: `referral_code` (snake_case)
- **API Response**: `referralCode` (camelCase)
- **Frontend**: Expected `referralCode`

The API wasn't properly mapping the database field to the expected format.

## Verification

After restart, you should see:
- ✅ Referral Code: `REFTXVRIO` (instead of blank)
- ✅ Referral Link: `http://localhost:3000/r/REFTXVRIO`
- ✅ Copy Link button works

If it still doesn't work, check browser developer tools (F12) → Network tab → `/api/ambassadors/dashboard` response to see if `referralCode` is now present in the JSON response.