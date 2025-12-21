-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert sample organization with generated API key
INSERT INTO organizations (id, name, api_key, settings)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Demo Organization',
  encode(gen_random_bytes(32), 'hex'),
  '{"retention_days": 365, "auto_delete": false}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings;

-- Insert sample consent records
INSERT INTO consent_records (
  id,
  organization_id,
  user_identifier,
  consent_type,
  status,
  ip_address,
  user_agent,
  metadata
) VALUES 
(
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'user@example.com',
  'marketing',
  'granted',
  '192.168.1.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '{"source": "website", "language": "en"}'::jsonb
),
(
  'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'user@example.com',
  'analytics',
  'granted',
  '192.168.1.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '{"source": "website", "language": "en"}'::jsonb
)
ON CONFLICT (organization_id, user_identifier, consent_type) DO NOTHING;

-- Insert sample bot detection session
INSERT INTO bot_detection_sessions (
  id,
  session_id,
  organization_id,
  user_identifier,
  ip_address,
  user_agent,
  verdict,
  confidence_score,
  signals
) VALUES (
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'session_123456',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'user@example.com',
  '192.168.1.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'human',
  0.9500,
  '{"mouse_movements": 150, "clicks": 25, "keystrokes": 50}'::jsonb
) ON CONFLICT (session_id) DO NOTHING;

-- Insert sample bot detection events
INSERT INTO bot_detection_events (
  session_id,
  event_type,
  event_data
) VALUES 
(
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'mouse_move',
  '{"x": 100, "y": 200, "timestamp": 1234567890}'::jsonb
),
(
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'click',
  '{"x": 150, "y": 250, "button": "left"}'::jsonb
);

-- Insert sample audit log
INSERT INTO audit_logs (
  organization_id,
  action,
  resource_type,
  resource_id,
  user_identifier,
  ip_address,
  changes
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'consent_granted',
  'consent_record',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'user@example.com',
  '192.168.1.1',
  '{"consent_type": "marketing", "status": "granted"}'::jsonb
);
