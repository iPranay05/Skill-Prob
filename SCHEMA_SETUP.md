# Database Schema Setup

## Issue with "type already exists" Error

If you encounter the error `ERROR: 42710: type "user_role" already exists`, it means the schema has been partially applied before. 

## Solutions

### Option 1: Reset Database (Recommended for Development)
If you're in development and can reset your database:

1. Drop and recreate your Supabase database
2. Run the schema.sql file fresh

### Option 2: Run Individual Migrations
If you need to preserve existing data, run only the new parts:

```sql
-- Only run the course-related schema (starting from line ~144)
-- Skip the user-related types and tables that already exist

-- Create course-related types (with error handling)
DO $$ BEGIN
    CREATE TYPE course_type AS ENUM ('live', 'recorded', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Continue with course tables...
```

### Option 3: Use Migration Scripts
Create separate migration files for each feature:

1. `001_initial_users.sql` - User management
2. `002_course_management.sql` - Course system
3. `003_content_management.sql` - Course content

## Current Schema Status

The schema.sql file has been updated with:
- ✅ `IF NOT EXISTS` for all table creations
- ✅ `IF NOT EXISTS` for all index creations  
- ✅ Error handling for type creations
- ⚠️ Policies may still conflict (they need to be dropped first)

## Running the Schema

```bash
# Connect to your Supabase database
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Run the schema
\i supabase/schema.sql
```

## Troubleshooting

If you still get errors:
1. Check which objects already exist
2. Comment out those sections in schema.sql
3. Run only the new parts
4. Or reset the database completely for a clean start