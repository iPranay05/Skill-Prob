import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Create live_session_participants table
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
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