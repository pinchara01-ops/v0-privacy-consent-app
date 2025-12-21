-- Enable pgcrypto extension for gen_random_uuid and gen_random_bytes functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types
CREATE TYPE consent_type AS ENUM ('marketing', 'analytics', 'functional', 'personalization');
CREATE TYPE consent_status AS ENUM ('granted', 'denied', 'pending');
CREATE TYPE bot_verdict AS ENUM ('human', 'bot', 'suspicious', 'unknown');
CREATE TYPE proof_status AS ENUM ('pending', 'verified', 'failed', 'expired');

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  webhook_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consent records table
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255) NOT NULL,
  consent_type consent_type NOT NULL,
  status consent_status NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  version VARCHAR(50) DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_user_consent UNIQUE (organization_id, user_identifier, consent_type)
);

-- Bot detection sessions table
CREATE TABLE IF NOT EXISTS bot_detection_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  verdict bot_verdict DEFAULT 'unknown',
  confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  signals JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bot detection events table
CREATE TABLE IF NOT EXISTS bot_detection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES bot_detection_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consent proofs table
CREATE TABLE IF NOT EXISTS consent_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
  proof_hash VARCHAR(255) UNIQUE NOT NULL,
  proof_data JSONB NOT NULL,
  blockchain_tx_id VARCHAR(255),
  status proof_status DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  user_identifier VARCHAR(255),
  ip_address INET,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consent_org_user ON consent_records(organization_id, user_identifier);
CREATE INDEX IF NOT EXISTS idx_consent_status ON consent_records(status);
CREATE INDEX IF NOT EXISTS idx_consent_created ON consent_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_session_org ON bot_detection_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_bot_verdict ON bot_detection_sessions(verdict);
CREATE INDEX IF NOT EXISTS idx_bot_created ON bot_detection_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_events_session ON bot_detection_events(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_consent ON consent_proofs(consent_id);
CREATE INDEX IF NOT EXISTS idx_proof_status ON consent_proofs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at BEFORE UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_detection_sessions_updated_at BEFORE UPDATE ON bot_detection_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
