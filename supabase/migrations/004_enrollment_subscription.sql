-- Migration 004: Course Enrollment and Subscription System
-- This migration sets up enrollment, subscription, and coupon management

-- Create enrollment-related types
DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Course enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status enrollment_status DEFAULT 'active',
    
    -- Payment information
    amount_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    
    -- Subscription details (if applicable)
    subscription_id UUID,
    
    -- Progress tracking
    progress JSONB DEFAULT '{"completedSessions": [], "totalSessions": 0, "completionPercentage": 0}',
    
    -- Access control
    access_expires_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    enrollment_source VARCHAR(50) DEFAULT 'direct', -- 'direct', 'referral', 'coupon'
    referral_code VARCHAR(50),
    coupon_code VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(course_id, student_id)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Subscription details
    subscription_type subscription_type NOT NULL,
    status subscription_status DEFAULT 'active',
    
    -- Pricing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Billing cycle
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Payment gateway details
    gateway_subscription_id VARCHAR(255),
    gateway_customer_id VARCHAR(255),
    
    -- Renewal tracking
    auto_renew BOOLEAN DEFAULT TRUE,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    failed_payment_count INTEGER DEFAULT 0,
    
    -- Cancellation
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status payment_status DEFAULT 'pending',
    
    -- Gateway information
    gateway VARCHAR(50) NOT NULL, -- 'razorpay', 'stripe', etc.
    gateway_payment_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    
    -- Payment method
    payment_method VARCHAR(50), -- 'card', 'upi', 'netbanking', 'wallet'
    payment_method_details JSONB,
    
    -- Coupon/discount applied
    coupon_code VARCHAR(50),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    payment_date TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refund_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
    
    -- Usage details
    discount_amount DECIMAL(10,2) NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate usage
    UNIQUE(coupon_id, user_id, course_id)
);

-- Enrollment capacity tracking (for real-time updates)
CREATE TABLE IF NOT EXISTS course_capacity (
    course_id UUID PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
    max_students INTEGER,
    current_enrollment INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrollment_date ON course_enrollments(enrollment_date);

CREATE INDEX IF NOT EXISTS idx_subscriptions_student_id ON subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_course_id ON subscriptions(course_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_course_enrollments_updated_at ON course_enrollments;
CREATE TRIGGER update_course_enrollments_updated_at 
    BEFORE UPDATE ON course_enrollments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update course enrollment count
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment enrollment count
        UPDATE courses 
        SET enrollment = jsonb_set(
            enrollment, 
            '{currentEnrollment}', 
            ((enrollment->>'currentEnrollment')::int + 1)::text::jsonb
        )
        WHERE id = NEW.course_id;
        
        -- Update capacity table
        INSERT INTO course_capacity (course_id, current_enrollment)
        VALUES (NEW.course_id, 1)
        ON CONFLICT (course_id) 
        DO UPDATE SET 
            current_enrollment = course_capacity.current_enrollment + 1,
            updated_at = NOW();
            
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement enrollment count
        UPDATE courses 
        SET enrollment = jsonb_set(
            enrollment, 
            '{currentEnrollment}', 
            GREATEST(((enrollment->>'currentEnrollment')::int - 1), 0)::text::jsonb
        )
        WHERE id = OLD.course_id;
        
        -- Update capacity table
        UPDATE course_capacity 
        SET 
            current_enrollment = GREATEST(current_enrollment - 1, 0),
            updated_at = NOW()
        WHERE course_id = OLD.course_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update enrollment counts
DROP TRIGGER IF EXISTS trigger_update_enrollment_count ON course_enrollments;
CREATE TRIGGER trigger_update_enrollment_count
    AFTER INSERT OR DELETE ON course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_enrollment_count();

-- Function to check enrollment capacity
CREATE OR REPLACE FUNCTION check_enrollment_capacity()
RETURNS TRIGGER AS $$
DECLARE
    max_capacity INTEGER;
    current_count INTEGER;
BEGIN
    -- Get course capacity
    SELECT 
        (enrollment->>'maxStudents')::int,
        (enrollment->>'currentEnrollment')::int
    INTO max_capacity, current_count
    FROM courses 
    WHERE id = NEW.course_id;
    
    -- Check if course has capacity limit and if it's exceeded
    IF max_capacity IS NOT NULL AND current_count >= max_capacity THEN
        RAISE EXCEPTION 'Course enrollment capacity exceeded. Maximum: %, Current: %', max_capacity, current_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check capacity before enrollment
DROP TRIGGER IF EXISTS trigger_check_enrollment_capacity ON course_enrollments;
CREATE TRIGGER trigger_check_enrollment_capacity
    BEFORE INSERT ON course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION check_enrollment_capacity();

-- RLS Policies
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_capacity ENABLE ROW LEVEL SECURITY;

-- Enrollment policies
DROP POLICY IF EXISTS "Students can view their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Mentors can view enrollments for their courses" ON course_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON course_enrollments;

CREATE POLICY "Students can view their own enrollments" ON course_enrollments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Mentors can view enrollments for their courses" ON course_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_enrollments.course_id 
            AND courses.mentor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all enrollments" ON course_enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Subscription policies
DROP POLICY IF EXISTS "Students can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;

CREATE POLICY "Students can view their own subscriptions" ON subscriptions
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Payment policies
DROP POLICY IF EXISTS "Students can view their own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

CREATE POLICY "Students can view their own payments" ON payments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can view all payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Course capacity policies (read-only for most users)
DROP POLICY IF EXISTS "Anyone can view course capacity" ON course_capacity;
CREATE POLICY "Anyone can view course capacity" ON course_capacity
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON course_enrollments TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON payments TO service_role;
GRANT ALL ON coupon_usage TO service_role;
GRANT ALL ON course_capacity TO service_role;

-- Initialize course capacity for existing courses
INSERT INTO course_capacity (course_id, max_students, current_enrollment)
SELECT 
    id,
    (enrollment->>'maxStudents')::int,
    COALESCE((enrollment->>'currentEnrollment')::int, 0)
FROM courses
ON CONFLICT (course_id) DO NOTHING;