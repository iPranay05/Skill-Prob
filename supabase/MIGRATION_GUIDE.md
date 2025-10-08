# Database Migration Guide

This guide explains how to set up the database schema using separate migration files for each feature.

## Migration Files

### 001_user_management.sql
- User authentication system
- OTP verification
- Password reset functionality
- User roles and permissions

### 002_course_management.sql
- Course creation and management
- Categories and tags
- Course reviews and ratings
- Coupons system

### 003_course_content.sql
- Course chapters and content
- File resources and downloads
- Student enrollments
- Progress tracking

## Running Migrations

### Option 1: Run Individual Migrations (Recommended)

Run each migration file separately in order:

```bash
# Connect to your Supabase database
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Run migrations in order
\i supabase/migrations/001_user_management.sql
\i supabase/migrations/002_course_management.sql
\i supabase/migrations/003_course_content.sql
```

### If you already ran 002 and got course_enrollments error:

```bash
# Fix the dependency issue
\i supabase/migrations/002_fix_dependencies.sql
# Then continue with
\i supabase/migrations/003_course_content.sql
```

### Option 2: Use Migration Runner

```bash
# Run the migration runner (tracks which migrations are applied)
\i supabase/run-migrations.sql
```

### Option 3: Fresh Database Setup

If you have a fresh database, you can run all at once:

```bash
# Run all migrations
cat supabase/migrations/*.sql | psql "postgresql://[user]:[password]@[host]:[port]/[database]"
```

## Migration Status

Each migration file includes:
- ✅ `IF NOT EXISTS` for all tables and indexes
- ✅ `DO $$ BEGIN ... EXCEPTION` blocks for types
- ✅ `DROP POLICY IF EXISTS` before creating policies
- ✅ Proper error handling for existing objects

## Troubleshooting

### If you get "already exists" errors:

1. **Check what exists**: 
   ```sql
   \dt  -- List tables
   \dT  -- List types
   ```

2. **Skip existing objects**: Comment out the parts that already exist

3. **Use migration runner**: It tracks what's been applied

### If you need to reset:

1. **Drop specific tables**:
   ```sql
   DROP TABLE IF EXISTS course_content CASCADE;
   DROP TABLE IF EXISTS course_chapters CASCADE;
   -- etc.
   ```

2. **Or reset entire schema**:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

## Adding New Migrations

When adding new features:

1. Create a new migration file: `004_feature_name.sql`
2. Follow the same pattern with error handling
3. Update the migration runner if using it
4. Test on a copy of production data first

## Environment-Specific Notes

### Development
- Safe to reset database completely
- Run fresh migrations each time

### Staging/Production
- Always backup first
- Test migrations on a copy
- Run migrations during maintenance windows
- Monitor for performance impact

## Verification

After running migrations, verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check sample data
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM tags;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

## Rollback Strategy

If you need to rollback:

1. **Backup current state**
2. **Drop new objects** in reverse order
3. **Restore from backup** if needed

Each migration is designed to be as safe as possible with existing data.