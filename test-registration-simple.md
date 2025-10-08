# Simple Registration Test

## Test Data (No Referral Code)

Use this data to test registration:

```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john.doe@example.com",
  "password": "TestPassword123!",
  "confirmPassword": "TestPassword123!"
}
```

## Expected Behavior

1. **Form submission** should succeed
2. **Console logs** should show:
   ```
   📧 [MOCK EMAIL]
   To: john.doe@example.com
   Subject: Verify Your Email - Skill Probe LMS
   HTML: <div style="font-family: Arial, sans-serif...
   ```
3. **Success message** should appear
4. **Redirect** to OTP verification page

## No More Errors

- ❌ `accountSid must start with AC`
- ❌ `connect ECONNREFUSED 127.0.0.1:6379`  
- ❌ `Could not find the 'referredBy' column`

## Test URL

Visit: `http://localhost:3000/auth/register`