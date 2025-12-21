-- Insert a demo organization for testing
INSERT INTO organizations (id, name, api_key, webhook_url, settings)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Demo Organization',
  'demo_key_' || encode(gen_random_bytes(16), 'hex'),
  'https://example.com/webhook',
  '{"retention_days": 365, "require_proof": true, "bot_detection_enabled": true}'
) ON CONFLICT DO NOTHING;

-- Insert sample consent records
INSERT INTO consent_records (organization_id, user_identifier, consent_type, status, ip_address, user_agent, metadata)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'user123@example.com', 'marketing', 'granted', '192.168.1.1', 'Mozilla/5.0...', '{"source": "website", "page": "/signup"}'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'user123@example.com', 'analytics', 'granted', '192.168.1.1', 'Mozilla/5.0...', '{"source": "website", "page": "/signup"}'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'user456@example.com', 'marketing', 'denied', '192.168.1.2', 'Mozilla/5.0...', '{"source": "website", "page": "/preferences"}')
ON CONFLICT DO NOTHING;
