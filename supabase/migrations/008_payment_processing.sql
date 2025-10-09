-- Payment Processing and Subscription Management Migration
-- This migration enhances payment processing with gateway integration and subscription lifecycle

-- Create payment gateway types
DO $$ BEGIN
    CREATE TYPE payment_gateway AS ENUM ('razorpay', 'stripe', 'paypal', 'wallet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE refund_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('credit', 'debit', 'conversion', 'payout', 'referral_bonus', 'registration_bonus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_type AS ENUM ('one-time', 'monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- Payment gateway configurations table
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway payment_gateway NOT NULL UNIQUE,
    config JSONB NOT NULL DEFAULT '{}', -- stores API keys, webhook secrets, etc.
    is_active BOOLEAN DEFAULT TRUE,
    test_mode BOOLEAN DEFAULT TRUE,
    supported_currencies TEXT[] DEFAULT ARRAY['INR'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_enrollments table if it doesn't exist (from migration 004)
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

-- Create subscriptions table if it doesn't exist (from migration 004)
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

-- Create courses table if it doesn't exist (from migration 002)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Create wallets table if it doesn't exist (from migration 006)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    user_type VARCHAR(20) NOT NULL, -- 'student', 'ambassador'
    
    -- Balance information
    balance JSONB NOT NULL DEFAULT '{
        "points": 0,
        "credits": 0,
        "currency": "INR"
    }',
    
    -- Wallet metadata
    total_earned DECIMAL(10,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_withdrawn DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet transactions table if it doesn't exist (from migration 006)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    
    -- Transaction details
    amount DECIMAL(10,2) NOT NULL,
    points INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    reference_id VARCHAR(255), -- reference to course enrollment, payout request, etc.
    
    -- Balance after transaction
    balance_after JSONB NOT NULL,
    
    -- Transaction metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table if it doesn't exist (from migration 004)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending',
    
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

-- Enhanced payments table (extending existing)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_webhook_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_signature VARCHAR(500);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_link VARCHAR(500);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS webhook_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Invoice details
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Status and dates
    status invoice_status DEFAULT 'draft',
    issued_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment reference
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- Invoice metadata
    line_items JSONB NOT NULL DEFAULT '[]',
    billing_address JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Refund details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    reason TEXT NOT NULL,
    status refund_status DEFAULT 'pending',
    
    -- Gateway information
    gateway payment_gateway NOT NULL,
    gateway_refund_id VARCHAR(255),
    
    -- Processing details
    requested_by UUID REFERENCES users(id), -- admin who processed
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    admin_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment webhooks log table
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway payment_gateway NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    webhook_id VARCHAR(255),
    
    -- Webhook data
    payload JSONB NOT NULL,
    signature VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    
    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription lifecycle events table
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'created', 'renewed', 'cancelled', 'expired', 'payment_failed'
    
    -- Event details
    previous_status subscription_status,
    new_status subscription_status,
    metadata JSONB DEFAULT '{}',
    
    -- Related payment
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet credit transactions (extending wallet system)
CREATE TABLE IF NOT EXISTS wallet_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Credit details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    source VARCHAR(50) NOT NULL, -- 'purchase', 'refund', 'admin_credit', 'referral_bonus'
    
    -- Expiration (if applicable)
    expires_at TIMESTAMP WITH TIME ZONE,
    is_expired BOOLEAN DEFAULT FALSE,
    
    -- Reference to source transaction
    source_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    source_refund_id UUID REFERENCES refunds(id) ON DELETE SET NULL,
    
    -- Usage tracking
    used_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_gateway ON payment_gateway_configs(gateway);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_active ON payment_gateway_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_payments_gateway_webhook_id ON payments(gateway_webhook_id);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_webhook_verified ON payments(webhook_verified);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON invoices(issued_at);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_student_id ON refunds(student_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_gateway_refund_id ON refunds(gateway_refund_id);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_gateway ON payment_webhooks(gateway);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_webhook_id ON payment_webhooks(webhook_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

CREATE INDEX IF NOT EXISTS idx_wallet_credits_wallet_id ON wallet_credits(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_credits_expires_at ON wallet_credits(expires_at);
CREATE INDEX IF NOT EXISTS idx_wallet_credits_source ON wallet_credits(source);

-- Indexes for dependency tables
CREATE INDEX IF NOT EXISTS idx_courses_mentor_id ON courses(mentor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(type);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_student_id ON subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_course_id ON subscriptions(course_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);

-- Triggers for updated_at (drop if exists to avoid conflicts)
DROP TRIGGER IF EXISTS update_payment_gateway_configs_updated_at ON payment_gateway_configs;
CREATE TRIGGER update_payment_gateway_configs_updated_at 
    BEFORE UPDATE ON payment_gateway_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
CREATE TRIGGER update_refunds_updated_at 
    BEFORE UPDATE ON refunds 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_credits_updated_at ON wallet_credits;
CREATE TRIGGER update_wallet_credits_updated_at 
    BEFORE UPDATE ON wallet_credits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for dependency tables (drop if exists to avoid conflicts)
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
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

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Functions for payment processing

-- Function to add wallet transaction (from migration 006)
CREATE OR REPLACE FUNCTION add_wallet_transaction(
    wallet_uuid UUID,
    trans_type transaction_type,
    trans_amount DECIMAL(10,2),
    trans_points INTEGER,
    trans_description TEXT,
    reference VARCHAR(255) DEFAULT NULL,
    trans_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
    current_balance JSONB;
    new_balance JSONB;
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance FROM wallets WHERE id = wallet_uuid;
    
    -- Calculate new balance
    IF trans_type IN ('credit', 'referral_bonus', 'registration_bonus') THEN
        new_balance := jsonb_set(
            jsonb_set(current_balance, '{points}', 
                ((current_balance->>'points')::INTEGER + trans_points)::TEXT::JSONB),
            '{credits}', 
                ((current_balance->>'credits')::DECIMAL + trans_amount)::TEXT::JSONB
        );
    ELSE
        new_balance := jsonb_set(
            jsonb_set(current_balance, '{points}', 
                ((current_balance->>'points')::INTEGER - trans_points)::TEXT::JSONB),
            '{credits}', 
                ((current_balance->>'credits')::DECIMAL - trans_amount)::TEXT::JSONB
        );
    END IF;
    
    -- Update wallet balance
    UPDATE wallets SET 
        balance = new_balance,
        updated_at = NOW()
    WHERE id = wallet_uuid;
    
    -- Insert transaction record
    INSERT INTO wallet_transactions (
        wallet_id, type, amount, points, description, 
        reference_id, balance_after, metadata
    ) VALUES (
        wallet_uuid, trans_type, trans_amount, trans_points, 
        trans_description, reference, new_balance, trans_metadata
    ) RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ language 'plpgsql';

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_month VARCHAR(6);
    sequence_num INTEGER;
    invoice_num VARCHAR(50);
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(
        CASE 
            WHEN invoice_number LIKE 'INV-' || year_month || '-%' 
            THEN SUBSTRING(invoice_number FROM LENGTH('INV-' || year_month || '-') + 1)::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM invoices;
    
    -- Format: INV-YYYYMM-NNNN
    invoice_num := 'INV-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ language 'plpgsql';

-- Function to create invoice for payment
CREATE OR REPLACE FUNCTION create_invoice_for_payment(
    payment_uuid UUID,
    line_items_param JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
    payment_record RECORD;
    invoice_id UUID;
    invoice_num VARCHAR(50);
BEGIN
    -- Get payment details
    SELECT p.*, ce.course_id, s.id as subscription_id
    INTO payment_record
    FROM payments p
    LEFT JOIN course_enrollments ce ON ce.id = p.enrollment_id
    LEFT JOIN subscriptions s ON s.id = p.subscription_id
    WHERE p.id = payment_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found: %', payment_uuid;
    END IF;
    
    -- Generate invoice number
    invoice_num := generate_invoice_number();
    
    -- Create invoice
    INSERT INTO invoices (
        invoice_number, student_id, course_id, subscription_id,
        subtotal, discount_amount, total_amount, currency,
        status, issued_at, payment_id, line_items
    ) VALUES (
        invoice_num, payment_record.student_id, payment_record.course_id, payment_record.subscription_id,
        payment_record.amount, payment_record.discount_amount, payment_record.amount, payment_record.currency,
        CASE WHEN payment_record.status = 'completed' THEN 'paid' ELSE 'sent' END,
        NOW(), payment_uuid, line_items_param
    ) RETURNING id INTO invoice_id;
    
    RETURN invoice_id;
END;
$$ language 'plpgsql';

-- Function to process refund
CREATE OR REPLACE FUNCTION process_refund(
    payment_uuid UUID,
    refund_amount DECIMAL(10,2),
    refund_reason TEXT,
    requested_by_uuid UUID
)
RETURNS UUID AS $$
DECLARE
    payment_record RECORD;
    refund_id UUID;
    wallet_id UUID;
BEGIN
    -- Get payment details
    SELECT * INTO payment_record FROM payments WHERE id = payment_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found: %', payment_uuid;
    END IF;
    
    IF payment_record.status != 'completed' THEN
        RAISE EXCEPTION 'Cannot refund payment that is not completed';
    END IF;
    
    -- Create refund record
    INSERT INTO refunds (
        payment_id, student_id, amount, currency, reason,
        gateway, requested_by, status
    ) VALUES (
        payment_uuid, payment_record.student_id, refund_amount, payment_record.currency,
        refund_reason, payment_record.gateway, requested_by_uuid, 'pending'
    ) RETURNING id INTO refund_id;
    
    -- Add credit to student wallet if refund is processed
    SELECT id INTO wallet_id FROM wallets WHERE user_id = payment_record.student_id;
    
    IF wallet_id IS NOT NULL THEN
        INSERT INTO wallet_credits (
            wallet_id, amount, currency, source, source_refund_id, remaining_amount
        ) VALUES (
            wallet_id, refund_amount, payment_record.currency, 'refund', refund_id, refund_amount
        );
        
        -- Update wallet balance
        PERFORM add_wallet_transaction(
            wallet_id,
            'credit',
            refund_amount,
            0,
            'Refund for payment: ' || payment_uuid::TEXT,
            refund_id::TEXT,
            jsonb_build_object('refund_id', refund_id, 'payment_id', payment_uuid)
        );
    END IF;
    
    RETURN refund_id;
END;
$$ language 'plpgsql';

-- Function to expire wallet credits
CREATE OR REPLACE FUNCTION expire_wallet_credits()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE wallet_credits 
    SET is_expired = TRUE, updated_at = NOW()
    WHERE expires_at < NOW() 
    AND is_expired = FALSE
    AND remaining_amount > 0;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ language 'plpgsql';

-- Function to use wallet credits for payment
CREATE OR REPLACE FUNCTION use_wallet_credits(
    wallet_uuid UUID,
    required_amount DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    credit_record RECORD;
    total_used DECIMAL(10,2) := 0;
    amount_to_use DECIMAL(10,2);
    remaining_needed DECIMAL(10,2) := required_amount;
BEGIN
    -- Use credits in FIFO order (oldest first)
    FOR credit_record IN 
        SELECT * FROM wallet_credits 
        WHERE wallet_id = wallet_uuid 
        AND remaining_amount > 0 
        AND is_expired = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at ASC
    LOOP
        EXIT WHEN remaining_needed <= 0;
        
        -- Calculate how much to use from this credit
        amount_to_use := LEAST(credit_record.remaining_amount, remaining_needed);
        
        -- Update the credit record
        UPDATE wallet_credits 
        SET 
            used_amount = used_amount + amount_to_use,
            remaining_amount = remaining_amount - amount_to_use,
            updated_at = NOW()
        WHERE id = credit_record.id;
        
        total_used := total_used + amount_to_use;
        remaining_needed := remaining_needed - amount_to_use;
    END LOOP;
    
    RETURN total_used;
END;
$$ language 'plpgsql';

-- RLS Policies
ALTER TABLE payment_gateway_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_credits ENABLE ROW LEVEL SECURITY;

-- Payment gateway configs (admin only)
DROP POLICY IF EXISTS "Admins can manage payment gateway configs" ON payment_gateway_configs;
CREATE POLICY "Admins can manage payment gateway configs" ON payment_gateway_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Invoices policies
DROP POLICY IF EXISTS "Students can read their invoices" ON invoices;
CREATE POLICY "Students can read their invoices" ON invoices
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
CREATE POLICY "Admins can manage all invoices" ON invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Refunds policies
DROP POLICY IF EXISTS "Students can read their refunds" ON refunds;
CREATE POLICY "Students can read their refunds" ON refunds
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all refunds" ON refunds;
CREATE POLICY "Admins can manage all refunds" ON refunds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Payment webhooks (system only)
DROP POLICY IF EXISTS "System can manage payment webhooks" ON payment_webhooks;
CREATE POLICY "System can manage payment webhooks" ON payment_webhooks
    FOR ALL WITH CHECK (true);

-- Subscription events (read-only for users)
DROP POLICY IF EXISTS "Students can read their subscription events" ON subscription_events;
CREATE POLICY "Students can read their subscription events" ON subscription_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE id = subscription_events.subscription_id 
            AND student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can read all subscription events" ON subscription_events;
CREATE POLICY "Admins can read all subscription events" ON subscription_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Wallet credits policies
DROP POLICY IF EXISTS "Users can read their wallet credits" ON wallet_credits;
CREATE POLICY "Users can read their wallet credits" ON wallet_credits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wallets 
            WHERE id = wallet_credits.wallet_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can manage wallet credits" ON wallet_credits;
CREATE POLICY "System can manage wallet credits" ON wallet_credits
    FOR ALL WITH CHECK (true);

-- RLS Policies for dependency tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Basic policies for dependency tables (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can read published courses" ON courses;
CREATE POLICY "Anyone can read published courses" ON courses
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Students can read their enrollments" ON course_enrollments;
CREATE POLICY "Students can read their enrollments" ON course_enrollments
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can read their subscriptions" ON subscriptions;
CREATE POLICY "Students can read their subscriptions" ON subscriptions
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can read their payments" ON payments;
CREATE POLICY "Students can read their payments" ON payments
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Users can read their wallets" ON wallets;
CREATE POLICY "Users can read their wallets" ON wallets
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read their wallet transactions" ON wallet_transactions;
CREATE POLICY "Users can read their wallet transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wallets 
            WHERE id = wallet_transactions.wallet_id 
            AND user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON payment_gateway_configs TO service_role;
GRANT ALL ON invoices TO service_role;
GRANT ALL ON refunds TO service_role;
GRANT ALL ON payment_webhooks TO service_role;
GRANT ALL ON subscription_events TO service_role;
GRANT ALL ON wallet_credits TO service_role;
GRANT ALL ON courses TO service_role;
GRANT ALL ON course_enrollments TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON payments TO service_role;
GRANT ALL ON wallets TO service_role;
GRANT ALL ON wallet_transactions TO service_role;

-- Insert default payment gateway configurations
INSERT INTO payment_gateway_configs (gateway, config, is_active, test_mode) VALUES 
('razorpay', '{"key_id": "", "key_secret": "", "webhook_secret": ""}', FALSE, TRUE),
('stripe', '{"publishable_key": "", "secret_key": "", "webhook_secret": ""}', FALSE, TRUE);