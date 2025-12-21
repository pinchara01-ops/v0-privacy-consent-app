-- Clean schema with proper IF NOT EXISTS checks for all objects
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types with proper checks
DO $$ BEGIN
    CREATE TYPE consent_type AS ENUM ('marketing', 'analytics', 'functional', 'necessary');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE consent_status AS ENUM ('granted', 'denied', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create consents table
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255) NOT NULL,
  consent_type consent_type NOT NULL,
  status consent_status NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_identifier, consent_type)
);

-- Create bot detection sessions table
CREATE TABLE IF NOT EXISTS bot_detection_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  user_identifier VARCHAR(255),
  is_bot BOOLEAN DEFAULT false,
  confidence_score DECIMAL(5,2) DEFAULT 0.00,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, session_id)
);

-- Create bot detection events table
CREATE TABLE IF NOT EXISTS bot_detection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES bot_detection_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create consent proofs table
CREATE TABLE IF NOT EXISTS consent_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  consent_id UUID NOT NULL REFERENCES consents(id) ON DELETE CASCADE,
  proof_hash VARCHAR(64) NOT NULL UNIQUE,
  proof_data JSONB NOT NULL,
  verification_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  user_identifier VARCHAR(255),
  ip_address INET,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consents_org_user ON consents(organization_id, user_identifier);
CREATE INDEX IF NOT EXISTS idx_consents_status ON consents(status);
CREATE INDEX IF NOT EXISTS idx_consents_created ON consents(created_at);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_org ON bot_detection_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_session ON bot_detection_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_bot_events_session ON bot_detection_events(session_id);
CREATE INDEX IF NOT EXISTS idx_bot_events_timestamp ON bot_detection_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_proofs_consent ON consent_proofs(consent_id);
CREATE INDEX IF NOT EXISTS idx_proofs_hash ON consent_proofs(proof_hash);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Create or replace update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist and recreate
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consents_updated_at ON consents;
CREATE TRIGGER update_consents_updated_at BEFORE UPDATE ON consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bot_sessions_updated_at ON bot_detection_sessions;
CREATE TRIGGER update_bot_sessions_updated_at BEFORE UPDATE ON bot_detection_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
