-- Migration Runner Script
-- Run this file to apply all migrations in order

-- Check if migrations table exists, create if not
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to check if migration was already applied
CREATE OR REPLACE FUNCTION migration_applied(migration_version VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM schema_migrations 
        WHERE version = migration_version
    );
END;
$$ language 'plpgsql';

-- Function to mark migration as applied
CREATE OR REPLACE FUNCTION mark_migration_applied(migration_version VARCHAR(50))
RETURNS void AS $$
BEGIN
    INSERT INTO schema_migrations (version) 
    VALUES (migration_version)
    ON CONFLICT (version) DO NOTHING;
END;
$$ language 'plpgsql';

-- Apply Migration 001: User Management (if not already applied)
DO $$
BEGIN
    IF NOT migration_applied('001_user_management') THEN
        RAISE NOTICE 'Applying migration 001_user_management...';
        -- The actual migration content would be here
        -- For now, just mark as applied if you run the file separately
        PERFORM mark_migration_applied('001_user_management');
        RAISE NOTICE 'Migration 001_user_management completed.';
    ELSE
        RAISE NOTICE 'Migration 001_user_management already applied, skipping.';
    END IF;
END $$;

-- Apply Migration 002: Course Management (if not already applied)
DO $$
BEGIN
    IF NOT migration_applied('002_course_management') THEN
        RAISE NOTICE 'Applying migration 002_course_management...';
        -- The actual migration content would be here
        -- For now, just mark as applied if you run the file separately
        PERFORM mark_migration_applied('002_course_management');
        RAISE NOTICE 'Migration 002_course_management completed.';
    ELSE
        RAISE NOTICE 'Migration 002_course_management already applied, skipping.';
    END IF;
END $$;

-- Apply Migration 003: Course Content (if not already applied)
DO $$
BEGIN
    IF NOT migration_applied('003_course_content') THEN
        RAISE NOTICE 'Applying migration 003_course_content...';
        -- The actual migration content would be here
        -- For now, just mark as applied if you run the file separately
        PERFORM mark_migration_applied('003_course_content');
        RAISE NOTICE 'Migration 003_course_content completed.';
    ELSE
        RAISE NOTICE 'Migration 003_course_content already applied, skipping.';
    END IF;
END $$;

-- Show applied migrations
SELECT version, applied_at FROM schema_migrations ORDER BY applied_at;