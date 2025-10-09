-- Admin Management Tables

-- Mentor applications table
CREATE TABLE IF NOT EXISTS mentor_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    application_data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Course moderations table
CREATE TABLE IF NOT EXISTS course_moderations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    reviewed_by UUID NOT NULL REFERENCES users(id),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('published', 'rejected')),
    review_notes TEXT,
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    transaction_id VARCHAR(255),
    notes TEXT,
    payout_details JSONB, -- Bank details, payment method, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table for tracking login activity
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'mentor_application', 'course_review', 'payout_request', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional notification data
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    read_by UUID[] DEFAULT '{}', -- Array of admin user IDs who have read this
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- System maintenance table
CREATE TABLE IF NOT EXISTS system_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    maintenance_type VARCHAR(50) NOT NULL, -- 'scheduled', 'emergency', 'update'
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    affected_services TEXT[], -- Array of affected service names
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentor_applications_user_id ON mentor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_status ON mentor_applications(status);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_submitted_at ON mentor_applications(submitted_at);

CREATE INDEX IF NOT EXISTS idx_course_moderations_course_id ON course_moderations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_moderations_reviewed_by ON course_moderations(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_course_moderations_reviewed_at ON course_moderations(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_requested_at ON payout_requests(requested_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_system_maintenance_status ON system_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_system_maintenance_scheduled_start ON system_maintenance(scheduled_start);

-- Triggers for updated_at
CREATE TRIGGER update_mentor_applications_updated_at 
    BEFORE UPDATE ON mentor_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at 
    BEFORE UPDATE ON payout_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_maintenance_updated_at 
    BEFORE UPDATE ON system_maintenance 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE mentor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_moderations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_maintenance ENABLE ROW LEVEL SECURITY;

-- Mentor applications policies
CREATE POLICY "Users can read their own mentor applications" ON mentor_applications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own mentor applications" ON mentor_applications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage mentor applications" ON mentor_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Course moderations policies
CREATE POLICY "Admins can manage course moderations" ON course_moderations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Payout requests policies
CREATE POLICY "Users can read their own payout requests" ON payout_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own payout requests" ON payout_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage payout requests" ON payout_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- User sessions policies
CREATE POLICY "Users can read their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage user sessions" ON user_sessions
    FOR ALL WITH CHECK (true);

-- Admin notifications policies
CREATE POLICY "Admins can read admin notifications" ON admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Service role can manage admin notifications" ON admin_notifications
    FOR ALL WITH CHECK (true);

-- System maintenance policies
CREATE POLICY "Admins can manage system maintenance" ON system_maintenance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Grant permissions
GRANT ALL ON mentor_applications TO service_role;
GRANT ALL ON course_moderations TO service_role;
GRANT ALL ON payout_requests TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT ALL ON admin_notifications TO service_role;
GRANT ALL ON system_maintenance TO service_role;

-- Functions for admin management

-- Function to create admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
    notification_type TEXT,
    title_text TEXT,
    message_text TEXT,
    notification_data JSONB DEFAULT NULL,
    priority_level TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO admin_notifications (
        type, title, message, data, priority
    ) VALUES (
        notification_type, title_text, message_text, notification_data, priority_level
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    notification_id UUID,
    admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_notifications 
    SET read_by = array_append(read_by, admin_user_id)
    WHERE id = notification_id 
    AND NOT (admin_user_id = ANY(read_by));
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR logout_at IS NOT NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE(
    total_users BIGINT,
    active_users BIGINT,
    total_mentors BIGINT,
    total_courses BIGINT,
    pending_applications BIGINT,
    pending_moderations BIGINT,
    pending_payouts BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE verification->>'emailVerified' = 'true') as active_users,
        (SELECT COUNT(*) FROM users WHERE role = 'mentor') as total_mentors,
        (SELECT COUNT(*) FROM courses WHERE status = 'published') as total_courses,
        (SELECT COUNT(*) FROM mentor_applications WHERE status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM courses WHERE status IN ('pending_review', 'draft')) as pending_moderations,
        (SELECT COUNT(*) FROM payout_requests WHERE status = 'pending') as pending_payouts,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM course_enrollments) as total_revenue;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create admin notification for new mentor applications
CREATE OR REPLACE FUNCTION notify_admin_mentor_application()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
        PERFORM create_admin_notification(
            'mentor_application',
            'New Mentor Application',
            'A new mentor application has been submitted and requires review.',
            jsonb_build_object('application_id', NEW.id, 'user_id', NEW.user_id),
            'normal'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mentor_application_notification
    AFTER INSERT OR UPDATE ON mentor_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_mentor_application();

-- Trigger to create admin notification for new payout requests
CREATE OR REPLACE FUNCTION notify_admin_payout_request()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
        PERFORM create_admin_notification(
            'payout_request',
            'New Payout Request',
            'A new payout request has been submitted and requires approval.',
            jsonb_build_object('payout_id', NEW.id, 'user_id', NEW.user_id, 'amount', NEW.amount),
            'normal'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payout_request_notification
    AFTER INSERT OR UPDATE ON payout_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_payout_request();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_admin_notification(TEXT, TEXT, TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO service_role;