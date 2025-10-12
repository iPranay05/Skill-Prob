-- Add verified_at column to otp_verifications table
-- This column tracks when the OTP was verified

ALTER TABLE otp_verifications 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_otp_verified_at ON otp_verifications(verified_at);

-- Update existing verified records to have a verified_at timestamp
-- Set it to created_at for existing verified records
UPDATE otp_verifications 
SET verified_at = created_at 
WHERE verified = true AND verified_at IS NULL;