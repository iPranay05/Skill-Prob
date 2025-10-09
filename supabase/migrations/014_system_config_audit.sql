-- System Configuration and Audit Logging Tables

-- System configurations table
CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table for tracking all system changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    resource VARCHAR(100) NOT NULL, -- users, courses, payments, etc.
    resource_id VARCHAR(255), -- ID of the affected resource
    old_values JSONB, -- Previous values (for updates)
    new_values JSONB, -- New values (for creates/updates)
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security monitoring table for tracking suspicious activities
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL, -- FAILED_LOGIN, SUSPICIOUS_ACTIVITY, RATE_LIMIT_EXCEEDED, etc.
    user_id UUID REFERENCES users(id), -- May be null for anonymous events
    ip_address INET,
    user_agent TEXT,
    details JSONB, -- Additional event-specific data
    severity VARCHAR(20) DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flags table (alternative to storing in system_configs)
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_roles TEXT[], -- Array of roles that can access this feature
    conditions JSONB, -- Additional conditions for feature activation
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB, -- Additional metadata
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);
CREATE INDEX IF NOT EXISTS idx_system_configs_category ON system_configs(category);
CREATE INDEX IF NOT EXISTS idx_system_configs_active ON system_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);

-- Triggers for updated_at
CREATE TRIGGER update_system_configs_updated_at 
    BEFORE UPDATE ON system_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at 
    BEFORE UPDATE ON feature_flags 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage system configs
CREATE POLICY "Super admins can manage system configs" ON system_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Admins can read system configs
CREATE POLICY "Admins can read system configs" ON system_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Only super admins can read audit logs
CREATE POLICY "Super admins can read audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Only service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Only super admins can manage security events
CREATE POLICY "Super admins can manage security events" ON security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Only service role can insert security events
CREATE POLICY "Service role can insert security events" ON security_events
    FOR INSERT WITH CHECK (true);

-- Only super admins can manage feature flags
CREATE POLICY "Super admins can manage feature flags" ON feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Admins can read feature flags
CREATE POLICY "Admins can read feature flags" ON feature_flags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Only service role can manage system metrics
CREATE POLICY "Service role can manage system metrics" ON system_metrics
    FOR ALL WITH CHECK (true);

-- Grant permissions
GRANT ALL ON system_configs TO service_role;
GRANT ALL ON audit_logs TO service_role;
GRANT ALL ON security_events TO service_role;
GRANT ALL ON feature_flags TO service_role;
GRANT ALL ON system_metrics TO service_role;

-- Functions for system monitoring

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    event_type_param TEXT,
    user_id_param UUID DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    details_param JSONB DEFAULT NULL,
    severity_param TEXT DEFAULT 'LOW'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (
        event_type, user_id, ip_address, user_agent, details, severity
    ) VALUES (
        event_type_param, user_id_param, ip_address_param, user_agent_param, details_param, severity_param
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record system metrics
CREATE OR REPLACE FUNCTION record_system_metric(
    metric_name_param TEXT,
    metric_value_param NUMERIC,
    metric_unit_param TEXT DEFAULT NULL,
    tags_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO system_metrics (
        metric_name, metric_value, metric_unit, tags
    ) VALUES (
        metric_name_param, metric_value_param, metric_unit_param, tags_param
    ) RETURNING id INTO metric_id;
    
    RETURN metric_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old system metrics (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_system_metrics(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM system_metrics 
    WHERE recorded_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get system health summary
CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS TABLE(
    total_users BIGINT,
    active_users_24h BIGINT,
    total_courses BIGINT,
    total_enrollments BIGINT,
    total_revenue NUMERIC,
    failed_logins_24h BIGINT,
    security_events_24h BIGINT,
    system_uptime_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM audit_logs WHERE action = 'LOGIN' AND created_at >= NOW() - INTERVAL '24 hours') as active_users_24h,
        (SELECT COUNT(*) FROM courses WHERE status = 'published') as total_courses,
        (SELECT COUNT(*) FROM course_enrollments) as total_enrollments,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM course_enrollments) as total_revenue,
        (SELECT COUNT(*) FROM security_events WHERE event_type = 'FAILED_LOGIN' AND created_at >= NOW() - INTERVAL '24 hours') as failed_logins_24h,
        (SELECT COUNT(*) FROM security_events WHERE created_at >= NOW() - INTERVAL '24 hours') as security_events_24h,
        24.0 as system_uptime_hours; -- This would be calculated from actual uptime monitoring
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_security_event(TEXT, UUID, INET, TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION record_system_metric(TEXT, NUMERIC, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_system_metrics(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_system_health_summary() TO service_role;

-- Function to initialize default configurations (to be called after super admin user exists)
CREATE OR REPLACE FUNCTION initialize_default_system_configs()
RETURNS VOID AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the first super admin user, or create a system user if none exists
    SELECT id INTO admin_user_id FROM users WHERE role = 'super_admin' LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        -- Create a system user for initial configuration
        INSERT INTO users (email, password, role, profile, verification)
        VALUES (
            'system@skillprobe.com',
            '$2a$12$system_placeholder_hash',
            'super_admin',
            '{"firstName": "System", "lastName": "Admin"}',
            '{"emailVerified": true, "phoneVerified": false, "kycStatus": "approved"}'
        ) RETURNING id INTO admin_user_id;
    END IF;

    -- Insert default system configurations if they don't exist
    INSERT INTO system_configs (key, value, description, category, updated_by) 
    SELECT * FROM (VALUES 
        (
            'pricing_config',
            '{
                "defaultCurrency": "INR",
                "taxRates": {"IN": 18, "US": 8.5, "UK": 20},
                "commissionRates": {"mentor": 70, "ambassador": 10, "platform": 20},
                "refundPolicy": {"allowRefunds": true, "refundWindowDays": 7, "refundPercentage": 100},
                "discountLimits": {"maxPercentage": 50, "maxFixedAmount": 5000}
            }'::jsonb,
            'Global pricing and commission configuration',
            'pricing',
            admin_user_id
        ),
        (
            'integration_config',
            '{
                "googleMeet": {"enabled": false, "clientId": "", "clientSecret": "", "redirectUri": ""},
                "paymentGateways": {
                    "razorpay": {"enabled": false, "keyId": "", "keySecret": "", "webhookSecret": ""},
                    "stripe": {"enabled": false, "publishableKey": "", "secretKey": "", "webhookSecret": ""}
                },
                "notifications": {
                    "email": {"provider": "smtp", "config": {}},
                    "sms": {"provider": "twilio", "config": {}}
                }
            }'::jsonb,
            'External service integration configuration',
            'integrations',
            admin_user_id
        )
    ) AS default_configs(key, value, description, category, updated_by)
    WHERE NOT EXISTS (
        SELECT 1 FROM system_configs WHERE system_configs.key = default_configs.key
    );

    -- Insert default feature flags if they don't exist
    INSERT INTO feature_flags (name, description, enabled, created_by, updated_by) 
    SELECT * FROM (VALUES 
        ('live_sessions_enabled', 'Enable live session functionality', true, admin_user_id, admin_user_id),
        ('ambassador_program_enabled', 'Enable ambassador referral program', true, admin_user_id, admin_user_id),
        ('internship_board_enabled', 'Enable internship job board', true, admin_user_id, admin_user_id),
        ('advanced_analytics_enabled', 'Enable advanced analytics dashboard', true, admin_user_id, admin_user_id)
    ) AS default_flags(name, description, enabled, created_by, updated_by)
    WHERE NOT EXISTS (
        SELECT 1 FROM feature_flags WHERE feature_flags.name = default_flags.name
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION initialize_default_system_configs() TO service_role;