-- Migration: Add referral code generation function
-- This creates a function to generate unique referral codes for ambassadors

-- Drop existing function if it exists (to handle return type changes)
DROP FUNCTION IF EXISTS generate_referral_code();

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate a random 8-character alphanumeric code
        code := upper(
            substring(
                encode(gen_random_bytes(6), 'base64'),
                1, 8
            )
        );
        
        -- Remove any non-alphanumeric characters and ensure it's 8 chars
        code := regexp_replace(code, '[^A-Z0-9]', '', 'g');
        
        -- If code is too short, pad with random characters
        WHILE length(code) < 8 LOOP
            code := code || chr(65 + floor(random() * 26)::int); -- Add A-Z
        END LOOP;
        
        -- Truncate to exactly 8 characters
        code := substring(code, 1, 8);
        
        -- Check if this code already exists
        SELECT COUNT(*) INTO exists_check 
        FROM ambassadors 
        WHERE referral_code = code;
        
        -- If code is unique, exit loop
        IF exists_check = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION generate_referral_code() IS 'Generates a unique 8-character alphanumeric referral code for ambassadors';

-- Create an index on referral_code for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_ambassadors_referral_code ON ambassadors(referral_code);

-- Test the function (optional - can be removed in production)
-- SELECT generate_referral_code() as sample_code;