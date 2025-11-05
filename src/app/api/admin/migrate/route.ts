import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Run OAuth migration
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
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

        -- Create live_session_participants table
        CREATE TABLE IF NOT EXISTS live_session_participants (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            left_at TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Ensure a user can only join a session once
            UNIQUE(session_id, user_id)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_live_session_participants_session_id ON live_session_participants(session_id);
        CREATE INDEX IF NOT EXISTS idx_live_session_participants_user_id ON live_session_participants(user_id);
        CREATE INDEX IF NOT EXISTS idx_live_session_participants_active ON live_session_participants(is_active) WHERE is_active = true;
      `
        });

        if (error) {
            console.error('Migration error:', error);
            return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Migration completed' });
    } catch (error) {
        console.error('Error running migration:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}