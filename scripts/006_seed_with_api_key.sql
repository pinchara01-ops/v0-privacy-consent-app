-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert a demo organization with a known API key for testing
INSERT INTO organizations (id, name, api_key, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Organization',
  'demo_api_key_12345678901234567890123456789012',
  '{"tier": "enterprise", "features": ["bot_detection", "proof_generation"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    api_key = EXCLUDED.api_key,
    settings = EXCLUDED.settings;

-- Display the API key for easy access
DO $$
BEGIN
  RAISE NOTICE 'Demo API Key: demo_api_key_12345678901234567890123456789012';
END $$;
