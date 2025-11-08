-- Add Google OAuth credentials to mentors table
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS google_project_id TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS google_client_id TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS google_client_secret TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS oauth_setup_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS oauth_setup_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster OAuth lookups
CREATE INDEX IF NOT EXISTS idx_mentors_oauth_setup ON mentors(oauth_setup_completed);
CREATE INDEX IF NOT EXISTS idx_mentors_google_tokens ON mentors(google_refresh_token) WHERE google_refresh_token IS NOT NULL;

-- Add RLS policies for OAuth data
CREATE POLICY "Mentors can manage their own OAuth credentials" ON mentors
  FOR ALL USING (auth.uid() = user_id);