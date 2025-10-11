-- Student Learning Features Migration
-- This migration adds support for quizzes, assignments, bookmarks, notes, and course forums

-- Create types for learning features
CREATE TYPE quiz_question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay');
CREATE TYPE assignment_status AS ENUM ('not_started', 'in_progress', 'submitted', 'graded');
CREATE TYPE forum_post_type AS ENUM ('question', 'discussion', 'announcement');

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    time_limit_minutes INTEGER, -- NULL means no time limit
    max_attempts INTEGER DEFAULT 1,
    passing_score INTEGER DEFAULT 70, -- percentage
    is_required BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type quiz_question_type NOT NULL,
    options JSONB, -- For multiple choice questions: ["option1", "option2", ...]
    correct_answer JSONB NOT NULL, -- Stores correct answer(s)
    explanation TEXT, -- Optional explanation for the answer
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER, -- percentage score
    answers JSONB NOT NULL DEFAULT '{}', -- question_id -> answer mapping
    time_taken_minutes INTEGER,
    passed BOOLEAN DEFAULT FALSE,
    
    UNIQUE(quiz_id, student_id, attempt_number)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_points INTEGER DEFAULT 100,
    submission_format VARCHAR(50) DEFAULT 'text', -- 'text', 'file', 'both'
    allowed_file_types TEXT[], -- ['pdf', 'doc', 'docx'] etc.
    max_file_size_mb INTEGER DEFAULT 10,
    is_required BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status assignment_status DEFAULT 'not_started',
    submission_text TEXT,
    file_urls TEXT[], -- Array of uploaded file URLs
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    score INTEGER, -- points earned
    feedback TEXT,
    graded_by UUID REFERENCES users(id), -- mentor who graded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(assignment_id, student_id)
);

-- Student bookmarks table
CREATE TABLE IF NOT EXISTS student_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    timestamp_seconds INTEGER, -- For video bookmarks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, content_id, timestamp_seconds)
);

-- Student notes table
CREATE TABLE IF NOT EXISTS student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    timestamp_seconds INTEGER, -- For video notes
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course forums table
CREATE TABLE IF NOT EXISTS course_forums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    post_type forum_post_type DEFAULT 'discussion',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    last_reply_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forum_post_id UUID NOT NULL REFERENCES course_forums(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_reply_id UUID REFERENCES forum_replies(id), -- For nested replies
    is_solution BOOLEAN DEFAULT FALSE, -- Mark as solution for questions
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum likes table
CREATE TABLE IF NOT EXISTS forum_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    forum_post_id UUID REFERENCES course_forums(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_like_target CHECK (
        (forum_post_id IS NOT NULL AND reply_id IS NULL) OR
        (forum_post_id IS NULL AND reply_id IS NOT NULL)
    ),
    UNIQUE(user_id, forum_post_id),
    UNIQUE(user_id, reply_id)
);

-- Student progress tracking enhancements
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completion_percentage INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(student_id, course_id, content_id),
    UNIQUE(student_id, quiz_id),
    UNIQUE(student_id, assignment_id)
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_percentage INTEGER NOT NULL,
    final_score INTEGER, -- Overall course score
    skills_verified TEXT[], -- Array of skills verified
    certificate_url VARCHAR(500), -- URL to generated certificate PDF
    is_verified BOOLEAN DEFAULT TRUE,
    verification_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_chapter_id ON quizzes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_student ON quiz_attempts(quiz_id, student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_chapter_id ON assignments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_student_course ON student_bookmarks(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content_id ON student_bookmarks(content_id);
CREATE INDEX IF NOT EXISTS idx_notes_student_course ON student_notes(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_notes_content_id ON student_notes(content_id);

CREATE INDEX IF NOT EXISTS idx_forums_course_id ON course_forums(course_id);
CREATE INDEX IF NOT EXISTS idx_forums_chapter_id ON course_forums(chapter_id);
CREATE INDEX IF NOT EXISTS idx_forums_author_id ON course_forums(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(forum_post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);

CREATE INDEX IF NOT EXISTS idx_progress_student_course ON student_progress(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_progress_content_id ON student_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);

-- Triggers for updated_at
CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON quizzes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at 
    BEFORE UPDATE ON assignments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at 
    BEFORE UPDATE ON assignment_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_notes_updated_at 
    BEFORE UPDATE ON student_notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_forums_updated_at 
    BEFORE UPDATE ON course_forums 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at 
    BEFORE UPDATE ON forum_replies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Functions for forum management
CREATE OR REPLACE FUNCTION update_forum_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE course_forums 
        SET replies_count = replies_count + 1,
            last_reply_at = NEW.created_at,
            last_reply_by = NEW.author_id
        WHERE id = NEW.forum_post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE course_forums 
        SET replies_count = replies_count - 1
        WHERE id = OLD.forum_post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER forum_reply_count_trigger
    AFTER INSERT OR DELETE ON forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_reply_count();

-- Function to increment forum views
CREATE OR REPLACE FUNCTION increment_forum_views(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE course_forums 
    SET views_count = views_count + 1 
    WHERE id = post_id;
END;
$$ language 'plpgsql';

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.certificate_number = 'CERT-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                             LPAD(nextval('certificate_sequence')::text, 6, '0');
    NEW.verification_code = UPPER(substring(md5(random()::text) from 1 for 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence for certificate numbers
CREATE SEQUENCE IF NOT EXISTS certificate_sequence START 1;

CREATE TRIGGER generate_certificate_number_trigger
    BEFORE INSERT ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION generate_certificate_number();

-- RLS Policies
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Quiz policies
CREATE POLICY "Enrolled students can view quizzes" ON quizzes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments 
            WHERE course_id = quizzes.course_id 
            AND student_id = auth.uid()
        )
    );

CREATE POLICY "Mentors can manage their course quizzes" ON quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = quizzes.course_id 
            AND mentor_id = auth.uid()
        )
    );

-- Quiz attempts policies
CREATE POLICY "Students can manage their quiz attempts" ON quiz_attempts
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Mentors can view quiz attempts for their courses" ON quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses c
            JOIN quizzes q ON q.course_id = c.id
            WHERE q.id = quiz_attempts.quiz_id 
            AND c.mentor_id = auth.uid()
        )
    );

-- Assignment policies
CREATE POLICY "Enrolled students can view assignments" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments 
            WHERE course_id = assignments.course_id 
            AND student_id = auth.uid()
        )
    );

CREATE POLICY "Mentors can manage their course assignments" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = assignments.course_id 
            AND mentor_id = auth.uid()
        )
    );

-- Assignment submissions policies
CREATE POLICY "Students can manage their submissions" ON assignment_submissions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Mentors can view and grade submissions" ON assignment_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses c
            JOIN assignments a ON a.course_id = c.id
            WHERE a.id = assignment_submissions.assignment_id 
            AND c.mentor_id = auth.uid()
        )
    );

-- Bookmark and notes policies
CREATE POLICY "Students can manage their bookmarks" ON student_bookmarks
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Students can manage their notes" ON student_notes
    FOR ALL USING (student_id = auth.uid());

-- Forum policies
CREATE POLICY "Enrolled students can view forums" ON course_forums
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments 
            WHERE course_id = course_forums.course_id 
            AND student_id = auth.uid()
        )
    );

CREATE POLICY "Enrolled students can create forum posts" ON course_forums
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM course_enrollments 
            WHERE course_id = course_forums.course_id 
            AND student_id = auth.uid()
        )
    );

CREATE POLICY "Authors can update their forum posts" ON course_forums
    FOR UPDATE USING (author_id = auth.uid());

-- Forum replies policies
CREATE POLICY "Enrolled students can view forum replies" ON forum_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_forums cf
            JOIN course_enrollments ce ON ce.course_id = cf.course_id
            WHERE cf.id = forum_replies.forum_post_id 
            AND ce.student_id = auth.uid()
        )
    );

CREATE POLICY "Enrolled students can create replies" ON forum_replies
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM course_forums cf
            JOIN course_enrollments ce ON ce.course_id = cf.course_id
            WHERE cf.id = forum_replies.forum_post_id 
            AND ce.student_id = auth.uid()
        )
    );

-- Progress tracking policies
CREATE POLICY "Students can manage their progress" ON student_progress
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Mentors can view student progress" ON student_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = student_progress.course_id 
            AND mentor_id = auth.uid()
        )
    );

-- Certificate policies
CREATE POLICY "Students can view their certificates" ON certificates
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Anyone can verify certificates" ON certificates
    FOR SELECT USING (true); -- For public verification

-- Grant permissions
GRANT ALL ON quizzes TO service_role;
GRANT ALL ON quiz_questions TO service_role;
GRANT ALL ON quiz_attempts TO service_role;
GRANT ALL ON assignments TO service_role;
GRANT ALL ON assignment_submissions TO service_role;
GRANT ALL ON student_bookmarks TO service_role;
GRANT ALL ON student_notes TO service_role;
GRANT ALL ON course_forums TO service_role;
GRANT ALL ON forum_replies TO service_role;
GRANT ALL ON forum_likes TO service_role;
GRANT ALL ON student_progress TO service_role;
GRANT ALL ON certificates TO service_role;
GRANT USAGE ON certificate_sequence TO service_role;