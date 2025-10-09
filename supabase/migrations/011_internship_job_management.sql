-- Migration 011: Internship and Job Management System
-- This migration sets up the internship and job posting functionality

-- Create job-related types
DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('internship', 'full-time', 'part-time', 'contract', 'freelance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('draft', 'published', 'closed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'rejected', 'hired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE work_mode AS ENUM ('remote', 'onsite', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Companies table (for employers)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    logo_url VARCHAR(500),
    industry VARCHAR(100),
    size VARCHAR(50), -- e.g., '1-10', '11-50', '51-200', etc.
    location JSONB, -- {"city": "Mumbai", "state": "Maharashtra", "country": "India"}
    founded_year INTEGER,
    
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Social media
    social_links JSONB DEFAULT '{}', -- {"linkedin": "url", "twitter": "url"}
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    
    -- Company and employer information
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- employer user
    
    -- Job details
    job_type job_type NOT NULL DEFAULT 'internship',
    work_mode work_mode NOT NULL DEFAULT 'remote',
    experience_level experience_level NOT NULL DEFAULT 'entry',
    
    -- Location
    location JSONB, -- {"city": "Mumbai", "state": "Maharashtra", "country": "India", "is_remote": false}
    
    -- Requirements and qualifications
    requirements JSONB NOT NULL DEFAULT '[]', -- Array of requirement strings
    qualifications JSONB NOT NULL DEFAULT '[]', -- Array of qualification strings
    skills JSONB NOT NULL DEFAULT '[]', -- Array of required skills
    
    -- Compensation
    salary JSONB, -- {"min": 50000, "max": 80000, "currency": "INR", "period": "monthly"}
    benefits JSONB DEFAULT '[]', -- Array of benefit strings
    
    -- Application settings
    application_deadline TIMESTAMP WITH TIME ZONE,
    max_applications INTEGER,
    current_applications INTEGER DEFAULT 0,
    
    -- Contact and application process
    application_email VARCHAR(255),
    application_url VARCHAR(500),
    contact_person JSONB, -- {"name": "John Doe", "email": "john@company.com", "phone": "+91..."}
    
    -- Status and visibility
    status job_status NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- SEO and metadata
    slug VARCHAR(255) UNIQUE,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Application data
    resume_url VARCHAR(500),
    cover_letter TEXT,
    portfolio_url VARCHAR(500),
    
    -- Additional information
    expected_salary JSONB, -- {"amount": 60000, "currency": "INR", "period": "monthly"}
    availability_date DATE,
    additional_info TEXT,
    
    -- Application status and tracking
    status application_status NOT NULL DEFAULT 'pending',
    status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_updated_by UUID REFERENCES users(id),
    
    -- Interview scheduling
    interview_scheduled_at TIMESTAMP WITH TIME ZONE,
    interview_notes TEXT,
    interview_feedback TEXT,
    
    -- Communication tracking
    last_communication_at TIMESTAMP WITH TIME ZONE,
    communication_count INTEGER DEFAULT 0,
    
    -- Timestamps
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_posting_id, applicant_id)
);

-- Application status history table
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    previous_status application_status,
    new_status application_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job categories table (for better organization)
CREATE TABLE IF NOT EXISTS job_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES job_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job posting categories junction table
CREATE TABLE IF NOT EXISTS job_posting_categories (
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (job_posting_id, category_id)
);

-- Saved jobs table (for students to bookmark jobs)
CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, job_posting_id)
);

-- Job alerts table (for students to get notified about matching jobs)
CREATE TABLE IF NOT EXISTS job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    
    -- Alert criteria
    keywords JSONB DEFAULT '[]', -- Array of keywords
    job_types JSONB DEFAULT '[]', -- Array of job types
    work_modes JSONB DEFAULT '[]', -- Array of work modes
    locations JSONB DEFAULT '[]', -- Array of location objects
    salary_range JSONB, -- {"min": 50000, "max": 100000, "currency": "INR"}
    
    -- Alert settings
    is_active BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'daily', -- 'immediate', 'daily', 'weekly'
    last_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies(is_verified);

CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_posted_by ON job_postings(posted_by);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON job_postings(job_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_work_mode ON job_postings(work_mode);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_published_at ON job_postings(published_at);
CREATE INDEX IF NOT EXISTS idx_job_postings_expires_at ON job_postings(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_postings_slug ON job_postings(slug);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting_id ON job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at);

CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_created_at ON application_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_posting_id ON saved_jobs(job_posting_id);

CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_active ON job_alerts(is_active);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_search ON job_postings USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
CREATE TRIGGER update_job_postings_updated_at 
    BEFORE UPDATE ON job_postings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at 
    BEFORE UPDATE ON job_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_alerts_updated_at ON job_alerts;
CREATE TRIGGER update_job_alerts_updated_at 
    BEFORE UPDATE ON job_alerts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update application count on job postings
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE job_postings 
        SET current_applications = current_applications + 1 
        WHERE id = NEW.job_posting_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE job_postings 
        SET current_applications = current_applications - 1 
        WHERE id = OLD.job_posting_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_job_application_count ON job_applications;
CREATE TRIGGER trigger_update_job_application_count
    AFTER INSERT OR DELETE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_job_application_count();

-- Trigger to create status history when application status changes
CREATE OR REPLACE FUNCTION create_application_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_status_history (
            application_id, 
            previous_status, 
            new_status, 
            changed_by,
            notes
        ) VALUES (
            NEW.id, 
            OLD.status, 
            NEW.status, 
            NEW.status_updated_by,
            'Status changed from ' || OLD.status || ' to ' || NEW.status
        );
        
        NEW.status_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_application_status_history ON job_applications;
CREATE TRIGGER trigger_create_application_status_history
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION create_application_status_history();

-- RLS Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Anyone can read verified companies" ON companies
    FOR SELECT USING (is_verified = true);

CREATE POLICY "Employers can manage their companies" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'employer'
        )
    );

CREATE POLICY "Admins can manage all companies" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Job postings policies
CREATE POLICY "Anyone can read published job postings" ON job_postings
    FOR SELECT USING (status = 'published' AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Employers can manage their job postings" ON job_postings
    FOR ALL USING (posted_by = auth.uid());

CREATE POLICY "Admins can manage all job postings" ON job_postings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Job applications policies
CREATE POLICY "Students can create applications" ON job_applications
    FOR INSERT WITH CHECK (
        applicant_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'student'
        )
    );

CREATE POLICY "Students can read their own applications" ON job_applications
    FOR SELECT USING (applicant_id = auth.uid());

CREATE POLICY "Employers can read applications for their jobs" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_postings 
            WHERE id = job_applications.job_posting_id 
            AND posted_by = auth.uid()
        )
    );

CREATE POLICY "Employers can update applications for their jobs" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM job_postings 
            WHERE id = job_applications.job_posting_id 
            AND posted_by = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all applications" ON job_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Application status history policies
CREATE POLICY "Users can read status history for their applications" ON application_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_applications 
            WHERE id = application_status_history.application_id 
            AND (applicant_id = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM job_postings 
                     WHERE id = job_applications.job_posting_id 
                     AND posted_by = auth.uid()
                 ))
        )
    );

-- Job categories policies
CREATE POLICY "Anyone can read job categories" ON job_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage job categories" ON job_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Saved jobs policies
CREATE POLICY "Users can manage their saved jobs" ON saved_jobs
    FOR ALL USING (user_id = auth.uid());

-- Job alerts policies
CREATE POLICY "Users can manage their job alerts" ON job_alerts
    FOR ALL USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON companies TO service_role;
GRANT ALL ON job_postings TO service_role;
GRANT ALL ON job_applications TO service_role;
GRANT ALL ON application_status_history TO service_role;
GRANT ALL ON job_categories TO service_role;
GRANT ALL ON job_posting_categories TO service_role;
GRANT ALL ON saved_jobs TO service_role;
GRANT ALL ON job_alerts TO service_role;

-- Sample job categories
INSERT INTO job_categories (name, description, slug) VALUES 
('Software Development', 'Programming and software engineering roles', 'software-development'),
('Data Science', 'Data analysis, machine learning, and AI roles', 'data-science'),
('Design', 'UI/UX design and graphic design roles', 'design'),
('Marketing', 'Digital marketing and growth roles', 'marketing'),
('Sales', 'Sales and business development roles', 'sales'),
('Operations', 'Operations and project management roles', 'operations'),
('Finance', 'Finance and accounting roles', 'finance'),
('Human Resources', 'HR and talent management roles', 'human-resources'),
('Customer Support', 'Customer service and support roles', 'customer-support'),
('Content', 'Content creation and writing roles', 'content')
ON CONFLICT (name) DO NOTHING;