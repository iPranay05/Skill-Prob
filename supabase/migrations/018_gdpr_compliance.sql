-- Security System Migration - Part 3: GDPR Compliance and Data Protection
-- Create tables for GDPR compliance, consent management, and data protection

CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    download_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    file_size BIGINT,
    export_format TEXT DEFAULT 'json',
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data deletion requests table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')) DEFAULT 'pending',
    deletion_date TIMESTAMP WITH TIME ZONE,
    retention_reason TEXT,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create consent records table
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'analytics', 'functional', 'necessary')),
    granted BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    version TEXT DEFAULT '1.0',
    withdrawal_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create legal holds table
CREATE TABLE IF NOT EXISTS legal_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_number TEXT NOT NULL,
    hold_type TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('active', 'released', 'expired')) DEFAULT 'active',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    released_by UUID REFERENCES users(id) ON DELETE SET NULL,
    hold_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    release_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file metadata table for secure file uploads
CREATE TABLE IF NOT EXISTS file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id TEXT UNIQUE NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    encryption_metadata JSONB,
    virus_scanned BOOLEAN DEFAULT false,
    scan_result TEXT CHECK (scan_result IN ('clean', 'infected', 'pending', 'error')) DEFAULT 'pending',
    scan_details JSONB,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checksum TEXT NOT NULL,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for data export requests
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_created_at ON data_export_requests(created_at);

-- Create indexes for data deletion requests
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_created_at ON data_deletion_requests(created_at);

-- Create indexes for consent records
CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_granted ON consent_records(granted);
CREATE INDEX IF NOT EXISTS idx_consent_records_timestamp ON consent_records(timestamp);

-- Create indexes for legal holds
CREATE INDEX IF NOT EXISTS idx_legal_holds_user_id ON legal_holds(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_holds_status ON legal_holds(status);
CREATE INDEX IF NOT EXISTS idx_legal_holds_case_number ON legal_holds(case_number);

-- Create indexes for file metadata
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_id ON file_metadata(file_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_by ON file_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_metadata_checksum ON file_metadata(checksum);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON file_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_file_metadata_scan_result ON file_metadata(scan_result);

-- Enable RLS on all tables
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for data export requests
CREATE POLICY "Users can view their own export requests" ON data_export_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own export requests" ON data_export_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all export requests" ON data_export_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update export requests" ON data_export_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for data deletion requests
CREATE POLICY "Users can view their own deletion requests" ON data_deletion_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own deletion requests" ON data_deletion_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all deletion requests" ON data_deletion_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for consent records
CREATE POLICY "Users can view their own consent records" ON consent_records
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own consent records" ON consent_records
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all consent records" ON consent_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for legal holds
CREATE POLICY "Admins can manage legal holds" ON legal_holds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for file metadata
CREATE POLICY "Users can view their own file metadata" ON file_metadata
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can create their own file metadata" ON file_metadata
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own file metadata" ON file_metadata
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can view all file metadata" ON file_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_data_export_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_data_export_requests_updated_at ON data_export_requests;
CREATE TRIGGER trigger_data_export_requests_updated_at
    BEFORE UPDATE ON data_export_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_data_export_requests_updated_at();

CREATE OR REPLACE FUNCTION update_data_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_data_deletion_requests_updated_at ON data_deletion_requests;
CREATE TRIGGER trigger_data_deletion_requests_updated_at
    BEFORE UPDATE ON data_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_data_deletion_requests_updated_at();

CREATE OR REPLACE FUNCTION update_consent_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_consent_records_updated_at ON consent_records;
CREATE TRIGGER trigger_consent_records_updated_at
    BEFORE UPDATE ON consent_records
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_records_updated_at();

CREATE OR REPLACE FUNCTION update_legal_holds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_legal_holds_updated_at ON legal_holds;
CREATE TRIGGER trigger_legal_holds_updated_at
    BEFORE UPDATE ON legal_holds
    FOR EACH ROW
    EXECUTE FUNCTION update_legal_holds_updated_at();

CREATE OR REPLACE FUNCTION update_file_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_file_metadata_updated_at ON file_metadata;
CREATE TRIGGER trigger_file_metadata_updated_at
    BEFORE UPDATE ON file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_file_metadata_updated_at();