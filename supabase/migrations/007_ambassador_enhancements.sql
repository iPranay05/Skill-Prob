-- Ambassador System Enhancements Migration
-- This migration adds invitation system and resource library for ambassadors

-- Create ambassador invitations table
CREATE TABLE IF NOT EXISTS ambassador_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'accepted', 'expired'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(ambassador_id, email)
);

-- Create ambassador resources table
CREATE TABLE IF NOT EXISTS ambassador_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'banner', 'social_post', 'email_template', 'video', 'guide'
    url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource downloads tracking table
CREATE TABLE IF NOT EXISTS resource_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES ambassador_resources(id) ON DELETE CASCADE,
    ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ambassador_invitations_ambassador_id ON ambassador_invitations(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_invitations_email ON ambassador_invitations(email);
CREATE INDEX IF NOT EXISTS idx_ambassador_invitations_status ON ambassador_invitations(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_invitations_sent_at ON ambassador_invitations(sent_at);

CREATE INDEX IF NOT EXISTS idx_ambassador_resources_type ON ambassador_resources(type);
CREATE INDEX IF NOT EXISTS idx_ambassador_resources_active ON ambassador_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_ambassador_resources_created_at ON ambassador_resources(created_at);

CREATE INDEX IF NOT EXISTS idx_resource_downloads_resource_id ON resource_downloads(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_ambassador_id ON resource_downloads(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_downloaded_at ON resource_downloads(downloaded_at);

-- Triggers for updated_at
CREATE TRIGGER update_ambassador_invitations_updated_at 
    BEFORE UPDATE ON ambassador_invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ambassador_resources_updated_at 
    BEFORE UPDATE ON ambassador_resources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE ambassador_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;

-- Ambassador invitations policies
CREATE POLICY "Ambassadors can manage their invitations" ON ambassador_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ambassadors 
            WHERE id = ambassador_invitations.ambassador_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all invitations" ON ambassador_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Ambassador resources policies
CREATE POLICY "Ambassadors can read active resources" ON ambassador_resources
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all resources" ON ambassador_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Resource downloads policies
CREATE POLICY "Ambassadors can read their downloads" ON resource_downloads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ambassadors 
            WHERE id = resource_downloads.ambassador_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can create download records" ON resource_downloads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read all downloads" ON resource_downloads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Grant permissions
GRANT ALL ON ambassador_invitations TO service_role;
GRANT ALL ON ambassador_resources TO service_role;
GRANT ALL ON resource_downloads TO service_role;

-- Insert sample resources
INSERT INTO ambassador_resources (title, description, type, url, created_by) VALUES 
('Social Media Banner - Course Promotion', 'High-quality banner for promoting courses on social media platforms', 'banner', 'https://example.com/banners/course-promo.png', NULL),
('Instagram Story Template', 'Ready-to-use Instagram story template with your referral code', 'social_post', 'https://example.com/templates/instagram-story.png', NULL),
('Email Invitation Template', 'Professional email template for inviting friends to join courses', 'email_template', 'https://example.com/templates/email-invitation.html', NULL),
('Facebook Post Template', 'Engaging Facebook post template with course highlights', 'social_post', 'https://example.com/templates/facebook-post.png', NULL),
('Ambassador Guide', 'Complete guide on how to maximize your ambassador earnings', 'guide', 'https://example.com/guides/ambassador-guide.pdf', NULL),
('LinkedIn Article Template', 'Professional LinkedIn article template for course promotion', 'email_template', 'https://example.com/templates/linkedin-article.html', NULL);

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE ambassador_invitations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'sent' 
    AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Create a scheduled job to run the expiration function (if using pg_cron extension)
-- SELECT cron.schedule('expire-invitations', '0 0 * * *', 'SELECT expire_old_invitations();');