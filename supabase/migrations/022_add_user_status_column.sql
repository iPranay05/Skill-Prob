-- Add status column to users table for user management
-- This enables admin functionality to suspend/activate users

-- Create user status enum
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Update existing users to have active status
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Add last_login_at column for tracking user activity
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create index for last_login_at
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- Add comment for documentation
COMMENT ON COLUMN users.status IS 'User account status: active, suspended, pending, or deleted';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of user''s last login for activity tracking';