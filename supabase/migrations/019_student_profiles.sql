-- Student Profiles Migration
-- This migration adds support for detailed student profiles for career portal

-- Student profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic career information
    resume_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    skills TEXT[] DEFAULT '{}',
    experience_level VARCHAR(20) DEFAULT 'entry',
    
    -- Job preferences
    preferred_job_types TEXT[] DEFAULT '{}', -- ['internship', 'full-time', etc.]
    preferred_locations TEXT[] DEFAULT '{}',
    preferred_work_modes TEXT[] DEFAULT '{}', -- ['remote', 'onsite', 'hybrid']
    
    -- Salary expectations
    salary_expectations JSONB DEFAULT '{}', -- {min: number, max: number, currency: string}
    
    -- Availability
    availability_date DATE,
    
    -- Bio and summary
    bio TEXT,
    
    -- Education history
    education JSONB DEFAULT '[]', -- Array of education objects
    
    -- Work experience
    work_experience JSONB DEFAULT '[]', -- Array of work experience objects
    
    -- Projects
    projects JSONB DEFAULT '[]', -- Array of project objects
    
    -- Certifications
    certifications JSONB DEFAULT '[]', -- Array of certification objects
    
    -- Profile completion and visibility
    profile_completion_percentage INTEGER DEFAULT 0,
    is_profile_public BOOLEAN DEFAULT FALSE,
    is_available_for_hire BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resume versions table (for tracking resume updates)
CREATE TABLE IF NOT EXISTS resume_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    is_current BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, version_number)
);

-- Job application tracking enhancements
CREATE TABLE IF NOT EXISTS application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'resume', 'cover_letter', 'portfolio', 'certificate'
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview feedback table
CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES users(id),
    interview_round INTEGER DEFAULT 1,
    interview_type VARCHAR(50), -- 'phone', 'video', 'onsite', 'technical', 'hr'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    conducted_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Feedback details
    technical_rating INTEGER CHECK (technical_rating >= 1 AND technical_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    cultural_fit_rating INTEGER CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    strengths TEXT,
    areas_for_improvement TEXT,
    additional_notes TEXT,
    recommendation VARCHAR(20), -- 'hire', 'no_hire', 'maybe', 'next_round'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student skill assessments (for skill verification)
CREATE TABLE IF NOT EXISTS skill_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL, -- 'quiz', 'project', 'certification', 'peer_review'
    score INTEGER, -- Percentage score
    max_score INTEGER DEFAULT 100,
    assessment_data JSONB DEFAULT '{}', -- Additional assessment details
    verified_by UUID REFERENCES users(id), -- Mentor or admin who verified
    verification_date TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE, -- For time-limited certifications
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, skill_name, assessment_type)
);

-- Career goals and tracking
CREATE TABLE IF NOT EXISTS career_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_title VARCHAR(255) NOT NULL,
    goal_description TEXT,
    target_role VARCHAR(255),
    target_company VARCHAR(255),
    target_salary DECIMAL(12,2),
    target_date DATE,
    
    -- Progress tracking
    current_progress INTEGER DEFAULT 0, -- Percentage
    milestones JSONB DEFAULT '[]', -- Array of milestone objects
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Networking and referrals
CREATE TABLE IF NOT EXISTS professional_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connected_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) NOT NULL, -- 'mentor', 'peer', 'referrer', 'colleague'
    
    -- Connection details
    company VARCHAR(255),
    position VARCHAR(255),
    how_connected TEXT, -- How they met/connected
    
    -- Interaction tracking
    last_interaction_date DATE,
    interaction_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'blocked'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, connected_user_id)
);

-- Job application analytics
CREATE TABLE IF NOT EXISTS application_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Daily metrics
    applications_sent INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    job_views INTEGER DEFAULT 0,
    saved_jobs INTEGER DEFAULT 0,
    
    -- Response metrics
    responses_received INTEGER DEFAULT 0,
    interviews_scheduled INTEGER DEFAULT 0,
    offers_received INTEGER DEFAULT 0,
    
    UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_experience_level ON student_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_student_profiles_availability ON student_profiles(availability_date);
CREATE INDEX IF NOT EXISTS idx_student_profiles_public ON student_profiles(is_profile_public);
CREATE INDEX IF NOT EXISTS idx_student_profiles_available ON student_profiles(is_available_for_hire);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_current ON resume_versions(is_current);

CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_type ON application_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_interview_feedback_application_id ON interview_feedback(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interviewer_id ON interview_feedback(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_scheduled_at ON interview_feedback(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_user_id ON skill_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_skill_name ON skill_assessments(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_verified ON skill_assessments(is_verified);

CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON career_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_status ON career_goals(status);
CREATE INDEX IF NOT EXISTS idx_career_goals_target_date ON career_goals(target_date);

CREATE INDEX IF NOT EXISTS idx_professional_connections_user_id ON professional_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_connections_connected_user_id ON professional_connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_professional_connections_type ON professional_connections(connection_type);

CREATE INDEX IF NOT EXISTS idx_application_analytics_user_id ON application_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_application_analytics_date ON application_analytics(date);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER update_student_profiles_updated_at 
    BEFORE UPDATE ON student_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_feedback_updated_at ON interview_feedback;
CREATE TRIGGER update_interview_feedback_updated_at 
    BEFORE UPDATE ON interview_feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_career_goals_updated_at ON career_goals;
CREATE TRIGGER update_career_goals_updated_at 
    BEFORE UPDATE ON career_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professional_connections_updated_at ON professional_connections;
CREATE TRIGGER update_professional_connections_updated_at 
    BEFORE UPDATE ON professional_connections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_data JSONB, user_profile JSONB)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    total_fields INTEGER := 15; -- Total number of profile fields to check
BEGIN
    -- Basic information (5 points each)
    IF profile_data->>'resume_url' IS NOT NULL AND profile_data->>'resume_url' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_data->>'bio' IS NOT NULL AND profile_data->>'bio' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_data->>'experience_level' IS NOT NULL AND profile_data->>'experience_level' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_data->'skills' IS NOT NULL AND jsonb_array_length(profile_data->'skills') > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    IF profile_data->'preferred_job_types' IS NOT NULL AND jsonb_array_length(profile_data->'preferred_job_types') > 0 THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_data->'education' IS NOT NULL AND jsonb_array_length(profile_data->'education') > 0 THEN
        completion_score := completion_score + 15;
    END IF;
    
    IF profile_data->>'portfolio_url' IS NOT NULL AND profile_data->>'portfolio_url' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_data->'preferred_locations' IS NOT NULL AND jsonb_array_length(profile_data->'preferred_locations') > 0 THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_data->'salary_expectations' IS NOT NULL AND profile_data->'salary_expectations' != '{}' THEN
        completion_score := completion_score + 5;
    END IF;
    
    -- User profile fields (from users table)
    IF user_profile->'firstName' IS NOT NULL AND user_profile->>'firstName' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF user_profile->'lastName' IS NOT NULL AND user_profile->>'lastName' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF user_profile->'avatar' IS NOT NULL AND user_profile->>'avatar' != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    -- Work experience (optional but valuable)
    IF profile_data->'work_experience' IS NOT NULL AND jsonb_array_length(profile_data->'work_experience') > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Projects (optional but valuable)
    IF profile_data->'projects' IS NOT NULL AND jsonb_array_length(profile_data->'projects') > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Certifications (optional)
    IF profile_data->'certifications' IS NOT NULL AND jsonb_array_length(profile_data->'certifications') > 0 THEN
        completion_score := completion_score + 5;
    END IF;
    
    RETURN LEAST(completion_score, 100); -- Cap at 100%
END;
$$ language 'plpgsql';

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    user_profile JSONB;
BEGIN
    -- Get user profile data
    SELECT profile INTO user_profile FROM users WHERE id = NEW.user_id;
    
    NEW.profile_completion_percentage := calculate_profile_completion(
        row_to_json(NEW)::jsonb,
        user_profile
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update profile completion
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON student_profiles;
CREATE TRIGGER update_profile_completion_trigger
    BEFORE INSERT OR UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- Function to track daily analytics
CREATE OR REPLACE FUNCTION track_application_analytics(
    p_user_id UUID,
    p_metric VARCHAR(50),
    p_increment INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
    INSERT INTO application_analytics (user_id, date)
    VALUES (p_user_id, CURRENT_DATE)
    ON CONFLICT (user_id, date) DO NOTHING;
    
    CASE p_metric
        WHEN 'applications_sent' THEN
            UPDATE application_analytics 
            SET applications_sent = applications_sent + p_increment
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
        WHEN 'profile_views' THEN
            UPDATE application_analytics 
            SET profile_views = profile_views + p_increment
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
        WHEN 'job_views' THEN
            UPDATE application_analytics 
            SET job_views = job_views + p_increment
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
        WHEN 'saved_jobs' THEN
            UPDATE application_analytics 
            SET saved_jobs = saved_jobs + p_increment
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
        WHEN 'responses_received' THEN
            UPDATE application_analytics 
            SET responses_received = responses_received + p_increment
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
        WHEN 'interviews_scheduled' THEN
            UPDATE application_analytics 
            SET interviews_scheduled = interviews_scheduled + p_increment
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
        WHEN 'offers_received' THEN
            UPDATE application_analytics 
            SET offers_received = offers_received + p_increment
            WHERE user_id = p_user_id AND date = CURRENT_DATE;
    END CASE;
END;
$$ language 'plpgsql';

-- RLS Policies
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_analytics ENABLE ROW LEVEL SECURITY;

-- Student profiles policies
CREATE POLICY "Users can read their own profile" ON student_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own profile" ON student_profiles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public profiles are readable by all" ON student_profiles
    FOR SELECT USING (is_profile_public = true);

-- Resume versions policies
CREATE POLICY "Users can manage their resume versions" ON resume_versions
    FOR ALL USING (user_id = auth.uid());

-- Application documents policies
CREATE POLICY "Users can read documents for their applications" ON application_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_applications 
            WHERE id = application_documents.application_id 
            AND applicant_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage documents for their applications" ON application_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM job_applications 
            WHERE id = application_documents.application_id 
            AND applicant_id = auth.uid()
        )
    );

-- Interview feedback policies
CREATE POLICY "Applicants can read their interview feedback" ON interview_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_applications 
            WHERE id = interview_feedback.application_id 
            AND applicant_id = auth.uid()
        )
    );

CREATE POLICY "Employers can manage interview feedback" ON interview_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM job_applications ja
            JOIN job_postings jp ON jp.id = ja.job_posting_id
            WHERE ja.id = interview_feedback.application_id 
            AND jp.employer_id = auth.uid()
        )
    );

-- Skill assessments policies
CREATE POLICY "Users can manage their skill assessments" ON skill_assessments
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Verified assessments are publicly readable" ON skill_assessments
    FOR SELECT USING (is_verified = true);

-- Career goals policies
CREATE POLICY "Users can manage their career goals" ON career_goals
    FOR ALL USING (user_id = auth.uid());

-- Professional connections policies
CREATE POLICY "Users can manage their connections" ON professional_connections
    FOR ALL USING (user_id = auth.uid() OR connected_user_id = auth.uid());

-- Application analytics policies
CREATE POLICY "Users can read their analytics" ON application_analytics
    FOR SELECT USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON student_profiles TO service_role;
GRANT ALL ON resume_versions TO service_role;
GRANT ALL ON application_documents TO service_role;
GRANT ALL ON interview_feedback TO service_role;
GRANT ALL ON skill_assessments TO service_role;
GRANT ALL ON career_goals TO service_role;
GRANT ALL ON professional_connections TO service_role;
GRANT ALL ON application_analytics TO service_role;