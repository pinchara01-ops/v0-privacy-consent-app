-- Migration: Add BotD Integration Tables
-- This adds tables specifically for the BotD (Fingerprint) integration
-- These complement the existing bot_detection_sessions table

-- Create enum for bot source (where detection came from)
DO $$ BEGIN
    CREATE TYPE bot_detection_source AS ENUM ('botd_library', 'fallback', 'whitelist');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table for BotD detection results (from browser extension)
CREATE TABLE IF NOT EXISTS botd_detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Detection metadata
  bot_detected BOOLEAN NOT NULL,
  bot_kind VARCHAR(255),
  detection_source bot_detection_source DEFAULT 'botd_library',
  
  -- Request context
  url TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- BotD specific data
  botd_request_time BIGINT, -- Request time from BotD
  botd_components JSONB, -- BotD component analysis
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Link to session if exists
  session_id VARCHAR(255),
  
  -- Index for faster queries
  CONSTRAINT fk_session FOREIGN KEY (session_id) 
    REFERENCES bot_detection_sessions(session_id) 
    ON DELETE SET NULL
);

-- Table for bot blocking events (when bots are actually blocked)
CREATE TABLE IF NOT EXISTS botd_blocked_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Bot information
  bot_kind VARCHAR(255) NOT NULL,
  detection_source bot_detection_source DEFAULT 'botd_library',
  
  -- Context
  url TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Blocking details
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  block_reason TEXT,
  
  -- Whether user appealed
  appealed BOOLEAN DEFAULT FALSE,
  appeal_email VARCHAR(255),
  appeal_message TEXT,
  appeal_resolved BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for whitelisted user agents/IPs
CREATE TABLE IF NOT EXISTS bot_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Whitelist type
  whitelist_type VARCHAR(50) NOT NULL CHECK (whitelist_type IN ('user_agent_pattern', 'ip_address', 'ip_range')),
  
  -- Value
  pattern_value TEXT NOT NULL,
  description TEXT,
  
  -- Auto-whitelisted or manual
  auto_added BOOLEAN DEFAULT FALSE,
  
  -- Active status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  CONSTRAINT unique_whitelist_entry UNIQUE (organization_id, whitelist_type, pattern_value)
);

-- Table for bot detection statistics (for dashboards)
CREATE TABLE IF NOT EXISTS botd_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Time period
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour < 24),
  
  -- Statistics
  total_detections INTEGER DEFAULT 0,
  bots_detected INTEGER DEFAULT 0,
  bots_blocked INTEGER DEFAULT 0,
  humans_detected INTEGER DEFAULT 0,
  whitelisted_bots INTEGER DEFAULT 0,
  
  -- By bot type (JSONB for flexibility)
  bot_type_breakdown JSONB DEFAULT '{}',
  
  -- Performance metrics
  avg_detection_time_ms DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_stats_period UNIQUE (organization_id, date, hour)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_botd_results_org_created 
  ON botd_detection_results(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_botd_results_bot_detected 
  ON botd_detection_results(bot_detected);

CREATE INDEX IF NOT EXISTS idx_botd_results_url 
  ON botd_detection_results(url);

CREATE INDEX IF NOT EXISTS idx_botd_blocked_org_created 
  ON botd_blocked_events(organization_id, blocked_at DESC);

CREATE INDEX IF NOT EXISTS idx_botd_blocked_bot_kind 
  ON botd_blocked_events(bot_kind);

CREATE INDEX IF NOT EXISTS idx_botd_blocked_ip 
  ON botd_blocked_events(ip_address);

CREATE INDEX IF NOT EXISTS idx_botd_whitelist_org_active 
  ON bot_whitelist(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_botd_stats_org_date 
  ON botd_statistics(organization_id, date DESC, hour DESC);

-- Create trigger for whitelist updated_at
CREATE TRIGGER update_bot_whitelist_updated_at 
  BEFORE UPDATE ON bot_whitelist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_botd_statistics_updated_at 
  BEFORE UPDATE ON botd_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default whitelisted bots (search engines, monitors, etc.)
INSERT INTO bot_whitelist (organization_id, whitelist_type, pattern_value, description, auto_added)
SELECT 
  id as organization_id,
  'user_agent_pattern',
  pattern,
  description,
  TRUE
FROM organizations
CROSS JOIN (
  VALUES
    ('(?i)googlebot', 'Google Search Bot'),
    ('(?i)bingbot', 'Bing Search Bot'),
    ('(?i)slurp', 'Yahoo Search Bot'),
    ('(?i)duckduckbot', 'DuckDuckGo Bot'),
    ('(?i)baiduspider', 'Baidu Search Bot'),
    ('(?i)yandexbot', 'Yandex Search Bot'),
    ('(?i)facebookexternalhit', 'Facebook Crawler'),
    ('(?i)twitterbot', 'Twitter Bot'),
    ('(?i)linkedinbot', 'LinkedIn Bot'),
    ('(?i)pinterest', 'Pinterest Bot'),
    ('(?i)slackbot', 'Slack Link Preview'),
    ('(?i)telegrambot', 'Telegram Bot'),
    ('(?i)whatsapp', 'WhatsApp Link Preview'),
    ('(?i)ia_archiver', 'Internet Archive'),
    ('(?i)uptimerobot', 'UptimeRobot Monitor'),
    ('(?i)pingdom', 'Pingdom Monitor'),
    ('(?i)statuscake', 'StatusCake Monitor'),
    ('(?i)newrelicpinger', 'New Relic Monitor'),
    ('(?i)monitis', 'Monitis Monitor')
) AS default_bots(pattern, description)
ON CONFLICT (organization_id, whitelist_type, pattern_value) DO NOTHING;

COMMENT ON TABLE botd_detection_results IS 'Stores all bot detection results from the browser extension using BotD library';
COMMENT ON TABLE botd_blocked_events IS 'Logs all bot blocking events with appeal tracking';
COMMENT ON TABLE bot_whitelist IS 'Whitelisted bots (search engines, monitors) that should not be blocked';
COMMENT ON TABLE botd_statistics IS 'Aggregated statistics for bot detection analytics and dashboards';
