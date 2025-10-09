-- Notification System Migration
-- This migration creates tables for comprehensive notification management

-- Create notification types (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority') THEN
        CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
    END IF;
END$$;

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    subject_template TEXT,
    body_template TEXT NOT NULL,
    channels notification_channel[] NOT NULL DEFAULT ARRAY['email']::notification_channel[],
    variables JSONB DEFAULT '[]', -- Array of variable names used in template
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES notification_templates(id),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    priority notification_priority DEFAULT 'normal',
    
    -- Message content (after template processing)
    subject TEXT,
    body TEXT NOT NULL,
    
    -- Recipient details
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Processing status
    status notification_status DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Delivery tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- External service tracking
    external_id VARCHAR(255), -- ID from email/SMS service
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- In-app notifications table
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    priority notification_priority DEFAULT 'normal',
    
    -- Action data (for clickable notifications)
    action_url VARCHAR(500),
    action_data JSONB DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Channel preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- Notification type preferences
    preferences JSONB DEFAULT '{
        "course_updates": {"email": true, "sms": false, "push": true, "in_app": true},
        "enrollment_confirmations": {"email": true, "sms": true, "push": true, "in_app": true},
        "payment_notifications": {"email": true, "sms": true, "push": false, "in_app": true},
        "live_session_reminders": {"email": true, "sms": true, "push": true, "in_app": true},
        "ambassador_updates": {"email": true, "sms": false, "push": true, "in_app": true},
        "job_applications": {"email": true, "sms": false, "push": true, "in_app": true},
        "system_announcements": {"email": true, "sms": false, "push": true, "in_app": true}
    }',
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification analytics table
CREATE TABLE IF NOT EXISTS notification_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES notification_templates(id),
    channel notification_channel NOT NULL,
    
    -- Metrics
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0, -- for emails
    clicked_count INTEGER DEFAULT 0, -- for emails with links
    
    -- Time period
    date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(template_id, channel, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_at ON notification_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON notification_queue(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_channel ON notification_queue(channel);
CREATE INDEX IF NOT EXISTS idx_notification_queue_priority ON notification_queue(priority);
CREATE INDEX IF NOT EXISTS idx_notification_queue_template ON notification_queue(template_id);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_read ON in_app_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created ON in_app_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_expires ON in_app_notifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user ON user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_analytics_template ON notification_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_date ON notification_analytics(date);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_channel ON notification_analytics(channel);

-- Triggers for updated_at
CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at 
    BEFORE UPDATE ON notification_queue 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete old processed notifications (older than 30 days)
    DELETE FROM notification_queue 
    WHERE status IN ('sent', 'delivered', 'failed') 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Delete expired in-app notifications
    DELETE FROM in_app_notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    -- Delete old read in-app notifications (older than 90 days)
    DELETE FROM in_app_notifications 
    WHERE is_read = TRUE 
    AND read_at < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Function to get user notification preferences with defaults
CREATE OR REPLACE FUNCTION get_user_notification_preferences(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_prefs JSONB;
BEGIN
    SELECT preferences INTO user_prefs
    FROM user_notification_preferences
    WHERE user_id = user_uuid;
    
    -- Return default preferences if user hasn't set any
    IF user_prefs IS NULL THEN
        RETURN '{
            "course_updates": {"email": true, "sms": false, "push": true, "in_app": true},
            "enrollment_confirmations": {"email": true, "sms": true, "push": true, "in_app": true},
            "payment_notifications": {"email": true, "sms": true, "push": false, "in_app": true},
            "live_session_reminders": {"email": true, "sms": true, "push": true, "in_app": true},
            "ambassador_updates": {"email": true, "sms": false, "push": true, "in_app": true},
            "job_applications": {"email": true, "sms": false, "push": true, "in_app": true},
            "system_announcements": {"email": true, "sms": false, "push": true, "in_app": true}
        }'::JSONB;
    END IF;
    
    RETURN user_prefs;
END;
$$ language 'plpgsql';

-- RLS Policies
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;

-- Templates policies (admin only)
CREATE POLICY "Admins can manage notification templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Anyone can read active templates" ON notification_templates
    FOR SELECT USING (is_active = true);

-- Queue policies (service role only for management)
CREATE POLICY "Service role can manage notification queue" ON notification_queue
    FOR ALL WITH CHECK (true);

-- In-app notifications policies
CREATE POLICY "Users can read their notifications" ON in_app_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON in_app_notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can create notifications" ON in_app_notifications
    FOR INSERT WITH CHECK (true);

-- Preferences policies
CREATE POLICY "Users can manage their notification preferences" ON user_notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- Analytics policies (admin only)
CREATE POLICY "Admins can read notification analytics" ON notification_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Grant permissions
GRANT ALL ON notification_templates TO service_role;
GRANT ALL ON notification_queue TO service_role;
GRANT ALL ON in_app_notifications TO service_role;
GRANT ALL ON user_notification_preferences TO service_role;
GRANT ALL ON notification_analytics TO service_role;

-- Insert default notification templates
INSERT INTO notification_templates (name, description, subject_template, body_template, channels, variables) VALUES 
('welcome_email', 'Welcome email for new users', 'Welcome to Skill Probe LMS, {{firstName}}!', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welcome to Skill Probe LMS!</h2>
    <p>Hi {{firstName}},</p>
    <p>Welcome to Skill Probe LMS! Your account has been successfully created and verified.</p>
    <p>You can now:</p>
    <ul>
      <li>Browse and enroll in courses</li>
      <li>Attend live sessions</li>
      <li>Access recorded content</li>
      <li>Apply for internships</li>
    </ul>
    <p>Get started by exploring our course catalog!</p>
    <p>Best regards,<br>Skill Probe LMS Team</p>
  </div>', 
 ARRAY['email']::notification_channel[], '["firstName"]'),

('otp_verification', 'OTP verification message', 'Verify Your {{type}} - Skill Probe LMS', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>{{type}} Verification</h2>
    <p>Hi {{firstName}},</p>
    <p>Please use the following OTP to verify your {{type}}:</p>
    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
      <h1 style="color: #333; font-size: 32px; margin: 0;">{{otp}}</h1>
    </div>
    <p>This OTP will expire in {{expiryMinutes}} minutes.</p>
    <p>Best regards,<br>Skill Probe LMS Team</p>
  </div>', 
 ARRAY['email', 'sms']::notification_channel[], '["firstName", "type", "otp", "expiryMinutes"]'),

('course_enrollment', 'Course enrollment confirmation', 'Course Enrollment Confirmed - {{courseTitle}}', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Course Enrollment Confirmed!</h2>
    <p>Hi {{firstName}},</p>
    <p>You have successfully enrolled in <strong>{{courseTitle}}</strong>.</p>
    <p><strong>Course Details:</strong></p>
    <ul>
      <li>Mentor: {{mentorName}}</li>
      <li>Type: {{courseType}}</li>
      <li>Amount Paid: ₹{{amountPaid}}</li>
    </ul>
    <p>You can now access the course content from your dashboard.</p>
    <p>Best regards,<br>Skill Probe LMS Team</p>
  </div>', 
 ARRAY['email', 'in_app']::notification_channel[], '["firstName", "courseTitle", "mentorName", "courseType", "amountPaid"]'),

('live_session_reminder', 'Live session reminder', 'Live Session Starting Soon - {{courseTitle}}', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Live Session Reminder</h2>
    <p>Hi {{firstName}},</p>
    <p>Your live session for <strong>{{courseTitle}}</strong> is starting in {{minutesUntilStart}} minutes.</p>
    <p><strong>Session Details:</strong></p>
    <ul>
      <li>Time: {{sessionTime}}</li>
      <li>Duration: {{duration}} minutes</li>
      <li>Mentor: {{mentorName}}</li>
    </ul>
    <p><a href="{{joinUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Join Session</a></p>
    <p>Best regards,<br>Skill Probe LMS Team</p>
  </div>', 
 ARRAY['email', 'sms', 'push', 'in_app']::notification_channel[], '["firstName", "courseTitle", "minutesUntilStart", "sessionTime", "duration", "mentorName", "joinUrl"]'),

('payment_success', 'Payment confirmation', 'Payment Successful - ₹{{amount}}', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Payment Successful!</h2>
    <p>Hi {{firstName}},</p>
    <p>Your payment of <strong>₹{{amount}}</strong> has been successfully processed.</p>
    <p><strong>Transaction Details:</strong></p>
    <ul>
      <li>Transaction ID: {{transactionId}}</li>
      <li>Date: {{paymentDate}}</li>
      <li>Method: {{paymentMethod}}</li>
      <li>Description: {{description}}</li>
    </ul>
    <p>Thank you for your payment!</p>
    <p>Best regards,<br>Skill Probe LMS Team</p>
  </div>', 
 ARRAY['email', 'sms', 'in_app']::notification_channel[], '["firstName", "amount", "transactionId", "paymentDate", "paymentMethod", "description"]'),

('ambassador_payout', 'Ambassador payout notification', 'Payout Processed - ₹{{amount}}', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Payout Processed!</h2>
    <p>Hi {{firstName}},</p>
    <p>Your payout request of <strong>₹{{amount}}</strong> has been processed successfully.</p>
    <p><strong>Payout Details:</strong></p>
    <ul>
      <li>Amount: ₹{{amount}}</li>
      <li>Processing Date: {{processedDate}}</li>
      <li>Reference ID: {{referenceId}}</li>
      <li>Bank Account: {{bankAccount}}</li>
    </ul>
    <p>The amount will be credited to your account within 2-3 business days.</p>
    <p>Best regards,<br>Skill Probe LMS Team</p>
  </div>', 
 ARRAY['email', 'sms', 'in_app']::notification_channel[], '["firstName", "amount", "processedDate", "referenceId", "bankAccount"]');