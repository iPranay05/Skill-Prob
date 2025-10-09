-- Job Management System Migration

-- Create job-related types (with better error handling)
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
    CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'rejected', 'selected', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE work_mode AS ENUM ('remote', 'onsite', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables if they exist (to handle partial migrations)
DROP TABLE IF EXISTS job_posting_categories CASCADE;
DROP TABLE IF EXISTS application_status_history CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS saved_jobs CASCADE;
DROP TABLE IF EXISTS job_alerts CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;
DROP TABLE IF EXISTS job_categories CASCADE;

-- Job postings table
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    company_name VARCHAR(255) NOT NULL,
    company_logo VARCHAR(500),
    company_website VARCHAR(500),
    
    -- Job details
    type job_type NOT NULL,
    experience_level experience_level NOT NULL,
    work_mode work_mode NOT NULL,
    location VARCHAR(255),
    
    -- Compensation
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'INR',
    stipend DECIMAL(10,2), -- For internships
    
    -- Requirements and skills
    requirements JSONB NOT NULL DEFAULT '{"skills": [], "qualifications": [], "experience": ""}',
    
    -- Application settings
    application_deadline TIMESTAMP WITH TIME ZONE,
    max_applications INTEGER,
    current_applications INTEGER DEFAULT 0,
    
    -- Contact and application details
    contact_email VARCHAR(255),
    application_instructions TEXT,
    external_application_url VARCHAR(500),
    
    -- Employer information
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status and metadata
    status job_status NOT NULL DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    remote_friendly BOOLEAN DEFAULT FALSE,
    
    -- SEO
    slug VARCHAR(255) UNIQUE,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job categories table
CREATE TABLE job_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES job_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job category junction table
CREATE TABLE job_posting_categories (
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (job_posting_id, category_id)
);

-- Job applications table
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Application data
    resume_url VARCHAR(500),
    cover_letter TEXT,
    portfolio_url VARCHAR(500),
    
    -- Additional information
    application_data JSONB NOT NULL DEFAULT '{}', -- Custom fields, answers to questions
    
    -- Status tracking
    status application_status NOT NULL DEFAULT 'pending',
    status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_updated_by UUID REFERENCES users(id),
    
    -- Communication
    notes TEXT, -- Internal notes by employer
    feedback TEXT, -- Feedback to candidate
    
    -- Interview scheduling
    interview_scheduled_at TIMESTAMP WITH TIME ZONE,
    interview_location VARCHAR(255),
    interview_notes TEXT,
    
    -- Timestamps
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(job_posting_id, applicant_id)
);

-- Application status history table
CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    previous_status application_status,
    new_status application_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved jobs table (for students to bookmark jobs)
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, job_posting_id)
);

-- Job alerts table (for students to get notified of matching jobs)
CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    
    -- Alert criteria
    keywords VARCHAR(500),
    location VARCHAR(255),
    job_type job_type,
    experience_level experience_level,
    work_mode work_mode,
    salary_min DECIMAL(12,2),
    category_ids UUID[],
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, immediate
    
    -- Tracking
    last_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_job_postings_employer_id ON job_postings(employer_id);
CREATE INDEX idx_job_postings_type ON job_postings(type);
CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_location ON job_postings(location);
CREATE INDEX idx_job_postings_experience_level ON job_postings(experience_level);
CREATE INDEX idx_job_postings_work_mode ON job_postings(work_mode);
CREATE INDEX idx_job_postings_published_at ON job_postings(published_at);
CREATE INDEX idx_job_postings_application_deadline ON job_postings(application_deadline);
CREATE INDEX idx_job_postings_featured ON job_postings(featured);
CREATE INDEX idx_job_postings_slug ON job_postings(slug);

CREATE INDEX idx_job_categories_parent_id ON job_categories(parent_id);
CREATE INDEX idx_job_categories_slug ON job_categories(slug);

CREATE INDEX idx_job_applications_job_posting_id ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_applied_at ON job_applications(applied_at);
CREATE INDEX idx_job_applications_status_updated_at ON job_applications(status_updated_at);

CREATE INDEX idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX idx_application_status_history_created_at ON application_status_history(created_at);

CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job_posting_id ON saved_jobs(job_posting_id);

CREATE INDEX idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX idx_job_alerts_active ON job_alerts(is_active);

-- Triggers for updated_at
CREATE TRIGGER update_job_postings_updated_at 
    BEFORE UPDATE ON job_postings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_alerts_updated_at 
    BEFORE UPDATE ON job_alerts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update application count when applications are added/removed
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
$$ language 'plpgsql';

-- Trigger to update application count
CREATE TRIGGER update_job_application_count_trigger
    AFTER INSERT OR DELETE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_job_application_count();

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
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
$$ language 'plpgsql';

-- Trigger to log status changes
CREATE TRIGGER log_application_status_change_trigger
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION log_application_status_change();

-- RLS Policies
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

-- Job postings policies
CREATE POLICY "Anyone can read published job postings" ON job_postings
    FOR SELECT USING (status = 'published');

CREATE POLICY "Employers can manage their job postings" ON job_postings
    FOR ALL USING (employer_id = auth.uid());

CREATE POLICY "Admins can manage all job postings" ON job_postings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Job categories policies (public read, admin write)
CREATE POLICY "Anyone can read job categories" ON job_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage job categories" ON job_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Job applications policies
CREATE POLICY "Applicants can read their own applications" ON job_applications
    FOR SELECT USING (applicant_id = auth.uid());

CREATE POLICY "Students can create applications" ON job_applications
    FOR INSERT WITH CHECK (
        applicant_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'student'
        )
    );

CREATE POLICY "Applicants can update their own applications" ON job_applications
    FOR UPDATE USING (applicant_id = auth.uid());

CREATE POLICY "Employers can read applications for their jobs" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_postings 
            WHERE id = job_applications.job_posting_id 
            AND employer_id = auth.uid()
        )
    );

CREATE POLICY "Employers can update applications for their jobs" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM job_postings 
            WHERE id = job_applications.job_posting_id 
            AND employer_id = auth.uid()
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
                     AND employer_id = auth.uid()
                 ))
        )
    );

-- Saved jobs policies
CREATE POLICY "Users can manage their saved jobs" ON saved_jobs
    FOR ALL USING (user_id = auth.uid());

-- Job alerts policies
CREATE POLICY "Users can manage their job alerts" ON job_alerts
    FOR ALL USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON job_postings TO service_role;
GRANT ALL ON job_categories TO service_role;
GRANT ALL ON job_posting_categories TO service_role;
GRANT ALL ON job_applications TO service_role;
GRANT ALL ON application_status_history TO service_role;
GRANT ALL ON saved_jobs TO service_role;
GRANT ALL ON job_alerts TO service_role;

-- Sample job categories
INSERT INTO job_categories (name, description, slug) VALUES 
('Software Development', 'Programming and software engineering roles', 'software-development'),
('Data Science', 'Data analysis, machine learning, and AI roles', 'data-science'),
('Product Management', 'Product strategy and management roles', 'product-management'),
('Design', 'UI/UX design and graphic design roles', 'design'),
('Marketing', 'Digital marketing and growth roles', 'marketing'),
('Sales', 'Sales and business development roles', 'sales'),
('Operations', 'Operations and project management roles', 'operations'),
('Finance', 'Finance and accounting roles', 'finance'),
('Human Resources', 'HR and talent management roles', 'human-resources'),
('Customer Support', 'Customer service and support roles', 'customer-support');

-- Function to generate job posting slug
CREATE OR REPLACE FUNCTION generate_job_slug(title TEXT, company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base slug from title and company
    base_slug := lower(regexp_replace(title || '-' || company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    
    -- Ensure uniqueness
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM job_postings WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ language 'plpgsql';

-- Function to automatically generate slug before insert
CREATE OR REPLACE FUNCTION set_job_posting_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_job_slug(NEW.title, NEW.company_name);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to set slug
CREATE TRIGGER set_job_posting_slug_trigger
    BEFORE INSERT ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION set_job_posting_slug();