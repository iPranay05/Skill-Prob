-- Ambassador System Migration
-- This migration creates the ambassador referral system with wallet and points

-- Create ambassador-related types
DO $ BEGIN
    CREATE TYPE ambassador_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE transaction_type AS ENUM ('credit', 'debit', 'conversion', 'payout', 'referral_bonus', 'registration_bonus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'rejected', 'processed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE referral_event_type AS ENUM ('registration', 'first_purchase', 'subscription_renewal', 'course_completion');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

-- Ambassadors table
CREATE TABLE IF NOT EXISTS ambassadors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    status ambassador_status NOT NULL DEFAULT 'pending',
    
    -- Application details
    application JSONB NOT NULL DEFAULT '{}', -- stores motivation, social media, experience
    
    -- Performance metrics
    performance JSONB NOT NULL DEFAULT '{
        "totalReferrals": 0,
        "successfulConversions": 0,
        "totalEarnings": 0,
        "currentPoints": 0,
        "lifetimePoints": 0
    }',
    
    -- Payout details for KYC
    payout_details JSONB NOT NULL DEFAULT '{}', -- stores bank details, PAN, etc.
    
    -- Admin review
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    
    -- Tracking data
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conversion_events JSONB NOT NULL DEFAULT '[]', -- array of conversion events
    
    -- Status and fraud detection
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'converted', 'inactive', 'fraud'
    fraud_flags JSONB DEFAULT '{}', -- stores fraud detection data
    
    -- Attribution tracking
    source_data JSONB DEFAULT '{}', -- IP, user agent, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(ambassador_id, student_id)
);

-- Wallets table for both students and ambassadors
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

-- Wallet transactions table
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

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Payout details
    amount DECIMAL(10,2) NOT NULL,
    points_redeemed INTEGER NOT NULL,
    status payout_status NOT NULL DEFAULT 'pending',
    
    -- Processing information
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    transaction_id VARCHAR(255), -- external payment transaction ID
    
    -- Admin notes
    admin_notes TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point configuration table for flexible point rules
CREATE TABLE IF NOT EXISTS point_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type referral_event_type NOT NULL,
    points_awarded INTEGER NOT NULL,
    conditions JSONB DEFAULT '{}', -- conditions for awarding points
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ambassadors_user_id ON ambassadors(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassadors_referral_code ON ambassadors(referral_code);
CREATE INDEX IF NOT EXISTS idx_ambassadors_status ON ambassadors(status);
CREATE INDEX IF NOT EXISTS idx_ambassadors_created_at ON ambassadors(created_at);

CREATE INDEX IF NOT EXISTS idx_referrals_ambassador_id ON referrals(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_referrals_student_id ON referrals(student_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_registration_date ON referrals(registration_date);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_type ON wallets(user_type);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference_id ON wallet_transactions(reference_id);

CREATE INDEX IF NOT EXISTS idx_payout_requests_ambassador_id ON payout_requests(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_requested_at ON payout_requests(requested_at);

CREATE INDEX IF NOT EXISTS idx_point_configurations_event_type ON point_configurations(event_type);
CREATE INDEX IF NOT EXISTS idx_point_configurations_active ON point_configurations(is_active);

-- Triggers for updated_at
CREATE TRIGGER update_ambassadors_updated_at 
    BEFORE UPDATE ON ambassadors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON referrals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at 
    BEFORE UPDATE ON payout_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_point_configurations_updated_at 
    BEFORE UPDATE ON point_configurations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Functions for ambassador system

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $
DECLARE
    code VARCHAR(20);
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate a random 8-character code with letters and numbers
        code := 'REF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_check 
        FROM ambassadors 
        WHERE referral_code = code;
        
        -- If code doesn't exist, return it
        IF exists_check = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$ language 'plpgsql';

-- Function to create wallet for user
CREATE OR REPLACE FUNCTION create_user_wallet(user_uuid UUID, wallet_type VARCHAR(20))
RETURNS UUID AS $
DECLARE
    wallet_id UUID;
BEGIN
    INSERT INTO wallets (user_id, user_type)
    VALUES (user_uuid, wallet_type)
    RETURNING id INTO wallet_id;
    
    RETURN wallet_id;
END;
$ language 'plpgsql';

-- Function to add wallet transaction
CREATE OR REPLACE FUNCTION add_wallet_transaction(
    wallet_uuid UUID,
    trans_type transaction_type,
    trans_amount DECIMAL(10,2),
    trans_points INTEGER,
    trans_description TEXT,
    reference VARCHAR(255) DEFAULT NULL,
    trans_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $
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
$ language 'plpgsql';

-- Function to process referral registration
CREATE OR REPLACE FUNCTION process_referral_registration(
    referral_code_param VARCHAR(20),
    student_uuid UUID,
    source_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $
DECLARE
    ambassador_record RECORD;
    referral_id UUID;
    wallet_id UUID;
    points_config RECORD;
BEGIN
    -- Find ambassador by referral code
    SELECT a.*, u.email as ambassador_email 
    INTO ambassador_record
    FROM ambassadors a
    JOIN users u ON u.id = a.user_id
    WHERE a.referral_code = referral_code_param 
    AND a.status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or inactive referral code: %', referral_code_param;
    END IF;
    
    -- Create referral record
    INSERT INTO referrals (
        ambassador_id, student_id, referral_code, 
        source_data, status
    ) VALUES (
        ambassador_record.id, student_uuid, referral_code_param,
        source_metadata, 'pending'
    ) RETURNING id INTO referral_id;
    
    -- Get points configuration for registration
    SELECT * INTO points_config 
    FROM point_configurations 
    WHERE event_type = 'registration' AND is_active = true
    LIMIT 1;
    
    -- Award points if configuration exists
    IF FOUND THEN
        -- Get ambassador's wallet
        SELECT id INTO wallet_id 
        FROM wallets 
        WHERE user_id = ambassador_record.user_id;
        
        -- Add transaction for registration bonus
        PERFORM add_wallet_transaction(
            wallet_id,
            'registration_bonus',
            0, -- no money for registration
            points_config.points_awarded,
            'Registration referral bonus for student: ' || student_uuid::TEXT,
            referral_id::TEXT,
            jsonb_build_object('event_type', 'registration', 'student_id', student_uuid)
        );
        
        -- Update ambassador performance
        UPDATE ambassadors SET 
            performance = jsonb_set(
                jsonb_set(performance, '{totalReferrals}', 
                    ((performance->>'totalReferrals')::INTEGER + 1)::TEXT::JSONB),
                '{currentPoints}',
                    ((performance->>'currentPoints')::INTEGER + points_config.points_awarded)::TEXT::JSONB
            ),
            updated_at = NOW()
        WHERE id = ambassador_record.id;
    END IF;
    
    RETURN referral_id;
END;
$ language 'plpgsql';

-- RLS Policies
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_configurations ENABLE ROW LEVEL SECURITY;

-- Ambassadors policies
CREATE POLICY "Ambassadors can read their own data" ON ambassadors
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can apply to become ambassadors" ON ambassadors
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Ambassadors can update their own data" ON ambassadors
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all ambassadors" ON ambassadors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Referrals policies
CREATE POLICY "Ambassadors can read their referrals" ON referrals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ambassadors 
            WHERE id = referrals.ambassador_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can create referrals" ON referrals
    FOR INSERT WITH CHECK (true);

-- Wallets policies
CREATE POLICY "Users can read their own wallet" ON wallets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage wallets" ON wallets
    FOR ALL WITH CHECK (true);

-- Wallet transactions policies
CREATE POLICY "Users can read their wallet transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wallets 
            WHERE id = wallet_transactions.wallet_id 
            AND user_id = auth.uid()
        )
    );

-- Payout requests policies
CREATE POLICY "Ambassadors can manage their payout requests" ON payout_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ambassadors 
            WHERE id = payout_requests.ambassador_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all payout requests" ON payout_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Point configurations policies (admin only)
CREATE POLICY "Admins can manage point configurations" ON point_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Anyone can read active point configurations" ON point_configurations
    FOR SELECT USING (is_active = true);

-- Grant permissions
GRANT ALL ON ambassadors TO service_role;
GRANT ALL ON referrals TO service_role;
GRANT ALL ON wallets TO service_role;
GRANT ALL ON wallet_transactions TO service_role;
GRANT ALL ON payout_requests TO service_role;
GRANT ALL ON point_configurations TO service_role;

-- Insert default point configurations
INSERT INTO point_configurations (event_type, points_awarded, conditions, created_by) VALUES 
('registration', 10, '{"description": "Points awarded when referred user registers"}', NULL),
('first_purchase', 50, '{"description": "Points awarded when referred user makes first purchase", "min_amount": 100}', NULL),
('subscription_renewal', 25, '{"description": "Points awarded when referred user renews subscription"}', NULL),
('course_completion', 15, '{"description": "Points awarded when referred user completes a course"}', NULL);