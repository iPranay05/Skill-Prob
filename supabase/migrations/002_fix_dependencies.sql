-- Migration 002 Fix: Remove dependency on course_enrollments table
-- Run this if you already applied migration 002 and got the course_enrollments error

-- Drop the problematic policy that references course_enrollments
DROP POLICY IF EXISTS "Enrolled students can create reviews" ON course_reviews;

-- Create a temporary policy without enrollment check
CREATE POLICY "Enrolled students can create reviews" ON course_reviews
    FOR INSERT WITH CHECK (
        student_id = auth.uid()
        -- Enrollment check will be added when course_enrollments table is created
    );

-- Note: This policy will be properly updated in migration 003