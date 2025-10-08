-- Migration 003: Course Content Management System
-- This migration sets up course chapters, content, and resources

-- Create content-related types
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('video', 'document', 'quiz', 'assignment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Course chapters table
CREATE TABLE IF NOT EXISTS course_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course content table (videos, documents, etc.)
CREATE TABLE IF NOT EXISTS course_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES course_chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type content_type NOT NULL,
    order_index INTEGER NOT NULL,
    
    -- Content metadata
    content_data JSONB NOT NULL DEFAULT '{}', -- stores video URLs, document links, quiz data, etc.
    
    -- Access control
    is_free BOOLEAN DEFAULT FALSE,
    duration_minutes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course resources table (downloadable materials)
CREATE TABLE IF NOT EXISTS course_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    download_count INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress JSONB NOT NULL DEFAULT '{"completedChapters": [], "totalProgress": 0}',
    
    -- Payment information
    payment_id VARCHAR(255),
    amount_paid DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'INR',
    
    UNIQUE(course_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_chapters_course_id ON course_chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_course_chapters_order ON course_chapters(course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_course_content_chapter_id ON course_content(chapter_id);
CREATE INDEX IF NOT EXISTS idx_course_content_order ON course_content(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_course_content_type ON course_content(type);

CREATE INDEX IF NOT EXISTS idx_course_resources_course_id ON course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_chapter_id ON course_resources(chapter_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrolled_at ON course_enrollments(enrolled_at);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_course_chapters_updated_at ON course_chapters;
CREATE TRIGGER update_course_chapters_updated_at 
    BEFORE UPDATE ON course_chapters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_content_updated_at ON course_content;
CREATE TRIGGER update_course_content_updated_at 
    BEFORE UPDATE ON course_content 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for course content
ALTER TABLE course_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read chapters of published courses" ON course_chapters;
DROP POLICY IF EXISTS "Mentors can manage their course chapters" ON course_chapters;
DROP POLICY IF EXISTS "Enrolled students can read course content" ON course_content;
DROP POLICY IF EXISTS "Mentors can manage their course content" ON course_content;
DROP POLICY IF EXISTS "Students can read their enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Students can enroll in courses" ON course_enrollments;
DROP POLICY IF EXISTS "Mentors can read enrollments for their courses" ON course_enrollments;

-- Course chapters policies
CREATE POLICY "Anyone can read chapters of published courses" ON course_chapters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = course_chapters.course_id 
            AND status = 'published'
        )
    );

CREATE POLICY "Mentors can manage their course chapters" ON course_chapters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = course_chapters.course_id 
            AND mentor_id = auth.uid()
        )
    );

-- Course content policies
CREATE POLICY "Enrolled students can read course content" ON course_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments ce
            JOIN course_chapters cc ON cc.id = course_content.chapter_id
            WHERE ce.course_id = cc.course_id 
            AND ce.student_id = auth.uid()
        ) OR 
        course_content.is_free = true
    );

CREATE POLICY "Mentors can manage their course content" ON course_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses c
            JOIN course_chapters cc ON cc.course_id = c.id
            WHERE cc.id = course_content.chapter_id 
            AND c.mentor_id = auth.uid()
        )
    );

-- Enrollments policies
CREATE POLICY "Students can read their enrollments" ON course_enrollments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can enroll in courses" ON course_enrollments
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Mentors can read enrollments for their courses" ON course_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = course_enrollments.course_id 
            AND mentor_id = auth.uid()
        )
    );

-- Function to increment download count for resources
CREATE OR REPLACE FUNCTION increment_download_count(resource_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE course_resources 
    SET download_count = download_count + 1 
    WHERE id = resource_id;
END;
$$ language 'plpgsql';

-- Update course reviews policy now that enrollments table exists
DROP POLICY IF EXISTS "Enrolled students can create reviews" ON course_reviews;
CREATE POLICY "Enrolled students can create reviews" ON course_reviews
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM course_enrollments 
            WHERE course_id = course_reviews.course_id 
            AND student_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON course_chapters TO service_role;
GRANT ALL ON course_content TO service_role;
GRANT ALL ON course_resources TO service_role;
GRANT ALL ON course_enrollments TO service_role;