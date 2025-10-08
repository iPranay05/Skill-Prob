-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'mentor', 'ambassador', 'employer', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE otp_type AS ENUM ('email', 'phone');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    profile JSONB NOT NULL DEFAULT '{}',
    verification JSONB NOT NULL DEFAULT '{"emailVerified": false, "phoneVerified": false, "kycStatus": "pending"}',
    preferences JSONB NOT NULL DEFAULT '{"notifications": {"email": true, "sms": true, "push": true}}',
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type otp_type NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password resets table
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_otp_user_type ON otp_verifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_verifications(code);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_resets(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_verifications WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Function to clean up expired password resets (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS void AS $$
BEGIN
    DELETE FROM password_resets WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data (except role)
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Only service role can insert users (for registration)
CREATE POLICY "Service role can insert users" ON users
    FOR INSERT WITH CHECK (true);

-- Only service role can manage OTP verifications
CREATE POLICY "Service role can manage OTPs" ON otp_verifications
    FOR ALL WITH CHECK (true);

-- Only service role can manage password resets
CREATE POLICY "Service role can manage password resets" ON password_resets
    FOR ALL WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON users TO service_role;
GRANT ALL ON otp_verifications TO service_role;
GRANT ALL ON password_resets TO service_role;

-- Sample data (optional - remove in production)
-- INSERT INTO users (email, password, role, profile, referral_code) VALUES 
-- ('admin@skillprobe.com', '$2a$12$example_hashed_password', 'super_admin', 
--  '{"firstName": "Admin", "lastName": "User"}', 'ADMIN001');

-- Course Management Schema

-- Create course-related types
DO $$ BEGIN
    CREATE TYPE course_type AS ENUM ('live', 'recorded', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_type AS ENUM ('one-time', 'monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('video', 'document', 'quiz', 'assignment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    type course_type NOT NULL DEFAULT 'recorded',
    status course_status NOT NULL DEFAULT 'draft',
    
    -- Pricing information
    pricing JSONB NOT NULL DEFAULT '{"amount": 0, "currency": "INR", "subscriptionType": "one-time"}',
    
    -- Course content metadata
    content JSONB NOT NULL DEFAULT '{"syllabus": [], "prerequisites": [], "learningOutcomes": []}',
    
    -- Media assets
    media JSONB NOT NULL DEFAULT '{"thumbnail": null, "trailer": null}',
    
    -- Enrollment settings
    enrollment JSONB NOT NULL DEFAULT '{"maxStudents": null, "currentEnrollment": 0}',
    
    -- Ratings and reviews
    ratings JSONB NOT NULL DEFAULT '{"average": 0, "count": 0}',
    
    -- SEO and metadata
    slug VARCHAR(255) UNIQUE,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course tags junction table
CREATE TABLE IF NOT EXISTS course_tags (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, tag_id)
);

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

-- Course reviews table
CREATE TABLE IF NOT EXISTS course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(course_id, student_id)
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course coupons junction table (if coupon is course-specific)
CREATE TABLE IF NOT EXISTS course_coupons (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, coupon_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_mentor_id ON courses(mentor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(type);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

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

CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_student_id ON course_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_rating ON course_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_chapters_updated_at 
    BEFORE UPDATE ON course_chapters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_content_updated_at 
    BEFORE UPDATE ON course_content 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_reviews_updated_at 
    BEFORE UPDATE ON course_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Anyone can read published courses" ON courses
    FOR SELECT USING (status = 'published');

CREATE POLICY "Mentors can manage their courses" ON courses
    FOR ALL USING (mentor_id = auth.uid());

CREATE POLICY "Admins can manage all courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

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

-- Reviews policies
CREATE POLICY "Anyone can read course reviews" ON course_reviews
    FOR SELECT USING (true);

CREATE POLICY "Enrolled students can create reviews" ON course_reviews
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM course_enrollments 
            WHERE course_id = course_reviews.course_id 
            AND student_id = auth.uid()
        )
    );

CREATE POLICY "Students can update their own reviews" ON course_reviews
    FOR UPDATE USING (student_id = auth.uid());

-- Categories and tags policies (public read, admin write)
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read tags" ON tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage tags" ON tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Grant permissions
GRANT ALL ON categories TO service_role;
GRANT ALL ON tags TO service_role;
GRANT ALL ON courses TO service_role;
GRANT ALL ON course_tags TO service_role;
GRANT ALL ON course_chapters TO service_role;
GRANT ALL ON course_content TO service_role;
GRANT ALL ON course_resources TO service_role;
GRANT ALL ON course_enrollments TO service_role;
GRANT ALL ON course_reviews TO service_role;
GRANT ALL ON coupons TO service_role;
GRANT ALL ON course_coupons TO service_role;

-- Sample categories
INSERT INTO categories (name, description, slug) VALUES 
('Programming', 'Software development and programming courses', 'programming'),
('Data Science', 'Data analysis, machine learning, and AI courses', 'data-science'),
('Design', 'UI/UX design and graphic design courses', 'design'),
('Business', 'Business skills and entrepreneurship courses', 'business'),
('Marketing', 'Digital marketing and growth courses', 'marketing');

-- Sample tags
INSERT INTO tags (name, slug) VALUES 
('JavaScript', 'javascript'),
('Python', 'python'),
('React', 'react'),
('Node.js', 'nodejs'),
('Machine Learning', 'machine-learning'),
('UI/UX', 'ui-ux'),
('Beginner', 'beginner'),
('Intermediate', 'intermediate'),
('Advanced', 'advanced');
-- Function to increment download count for resources
CREATE OR REPLACE FUNCTION increment_download_count(resource_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE course_resources 
    SET download_count = download_count + 1 
    WHERE id = resource_id;
END;
$$ language 'plpgsql';
