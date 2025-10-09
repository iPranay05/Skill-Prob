# Referral Code Generation Fix

## Problem Identified

The ambassador dashboard was showing blank referral codes because:

1. **Missing Database Function**: The `generate_referral_code()` PostgreSQL function was not created
2. **No Fallback Logic**: When the database function failed, there was no backup method
3. **Existing Records**: Some ambassador records might already exist without referral codes

## Solution Implemented

### 1. Database Function Creation
**File**: `supabase/migrations/010_referral_code_generation.sql`

- Creates `generate_referral_code()` PostgreSQL function
- Generates unique 8-character alphanumeric codes
- Includes collision detection and retry logic
- Adds performance index on `referral_code` column

### 2. Fallback Logic in Service
**File**: `src/lib/ambassadorService.ts`

- Added `generateReferralCodeFallback()` method
- JavaScript-based code generation as backup
- Handles database function failures gracefully
- Includes uniqueness checking

### 3. Data Repair Scripts
**Files**: 
- `scripts/fix-missing-referral-codes.js` - Fixes existing records
- `scripts/test-referral-generation.js` - Tests the system

## How to Apply the Fix

### Step 1: Run Database Migration
```bash
# Apply the new migration
supabase migration up 010_referral_code_generation.sql
```

### Step 2: Fix Existing Records
```bash
# Fix any existing ambassadors without referral codes
node scripts/fix-missing-referral-codes.js
```

### Step 3: Test the System
```bash
# Verify everything is working
node scripts/test-referral-generation.js
```

## Technical Details

### Database Function Logic
```sql
-- Generates 8-character codes like: ABC12XYZ
-- Uses base64 encoding + random padding
-- Checks for uniqueness in ambassadors table
-- Retries until unique code is found
```

### Fallback Logic
```javascript
// JavaScript fallback when DB function fails
// Generates codes like: AMB1A2B3
// Includes timestamp suffix for uniqueness
// Maximum 10 attempts before timestamp fallback
```

### Code Format
- **Length**: 8 characters
- **Characters**: A-Z, 0-9 (uppercase alphanumeric)
- **Examples**: `ABC12XYZ`, `DEF45GHI`, `AMB7K9L2`

## Security Considerations

1. **Uniqueness**: Both methods check for existing codes
2. **Collision Handling**: Retry logic prevents duplicates
3. **Rate Limiting**: Fallback has attempt limits
4. **No Sensitive Data**: Codes contain no personal information

## Performance Impact

- **Database Function**: Very fast, runs in PostgreSQL
- **Index Added**: Fast lookups on `referral_code` column
- **Fallback**: Slightly slower but only used when DB function fails

## Testing

The fix includes comprehensive testing:

1. **Database Function Test**: Verifies PostgreSQL function works
2. **Fallback Test**: Ensures JavaScript method works
3. **Existing Data Check**: Shows current ambassador status
4. **Integration Test**: End-to-end referral flow

## Expected Results

After applying the fix:

1. ✅ **Dashboard Shows Codes**: Ambassador dashboard displays referral codes
2. ✅ **New Ambassadors**: Get codes automatically during registration
3. ✅ **Existing Ambassadors**: Have codes backfilled
4. ✅ **Referral Links Work**: Short links like `/r/ABC12XYZ` function properly
5. ✅ **Analytics Track**: Click and conversion tracking works

## Monitoring

Watch for these metrics post-fix:
- Ambassador registration success rate
- Referral link click-through rates
- Conversion tracking accuracy
- Dashboard load times

## Rollback Plan

If issues occur:
1. Revert migration: `supabase migration down`
2. Remove fallback code from `ambassadorService.ts`
3. Use manual code assignment temporarily

This fix ensures the referral system is robust and production-ready!