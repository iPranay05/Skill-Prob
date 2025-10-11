-- Performance Optimization Indexes for Skill Probe LMS
-- This migration adds minimal, safe indexes only for columns that definitely exist

-- Only create indexes for users table (we know this exists with these columns)
-- JSONB indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_verification_gin ON users USING gin(verification);
CREATE INDEX IF NOT EXISTS idx_users_preferences_gin ON users USING gin(preferences);
CREATE INDEX IF NOT EXISTS idx_users_profile_gin ON users USING gin(profile);

-- Only create indexes if we can verify both table and column exist
DO $$ 
BEGIN
    -- Check if courses table exists and has the expected columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'mentor_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_courses_mentor_id ON courses(mentor_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'category_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'type'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(type);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'pricing'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_courses_pricing_gin ON courses USING gin(pricing);
    END IF;
END $$;

-- Job postings indexes (only if table and columns exist)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_postings' AND column_name = 'employer_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_job_postings_employer_id ON job_postings(employer_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_postings' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_postings' AND column_name = 'type'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_job_postings_type ON job_postings(type);
    END IF;
END $$;

-- Job applications indexes (only if table and columns exist)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'job_posting_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting_id ON job_applications(job_posting_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'applicant_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
    END IF;
END $$;

-- Course enrollments indexes (only if table and columns exist)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_enrollments' AND column_name = 'student_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_enrollments' AND column_name = 'course_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
    END IF;
    
    -- Only create status index if the column actually exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_enrollments' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_enrollments' AND column_name = 'enrollment_date'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrollment_date ON course_enrollments(enrollment_date);
    END IF;
END $$;