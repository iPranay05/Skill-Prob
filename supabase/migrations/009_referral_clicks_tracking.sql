-- Migration: Add referral clicks tracking table
-- This tracks clicks on referral links for analytics (separate from conversions)

-- Create referral_clicks table for tracking link clicks
CREATE TABLE IF NOT EXISTS referral_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    ip_hash VARCHAR(16), -- Hashed IP for privacy
    metadata JSONB DEFAULT '{}',
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_clicks_ambassador_id ON referral_clicks(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_clicked_at ON referral_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_ip_hash ON referral_clicks(ip_hash);

-- Add RLS policies
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Ambassadors can view their own click data
CREATE POLICY "Ambassadors can view own clicks" ON referral_clicks
    FOR SELECT USING (
        ambassador_id IN (
            SELECT id FROM ambassadors WHERE user_id = auth.uid()
        )
    );

-- Admins can view all click data
CREATE POLICY "Admins can view all clicks" ON referral_clicks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE referral_clicks IS 'Tracks clicks on ambassador referral links for analytics';
COMMENT ON COLUMN referral_clicks.ip_hash IS 'Hashed IP address for privacy compliance';
COMMENT ON COLUMN referral_clicks.metadata IS 'Additional tracking data (user agent, referrer, etc.)';

-- Create function to clean up old click data (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_referral_clicks()
RETURNS void AS $$
BEGIN
    -- Delete click data older than 1 year
    DELETE FROM referral_clicks 
    WHERE clicked_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-referral-clicks', '0 2 * * 0', 'SELECT cleanup_old_referral_clicks();');