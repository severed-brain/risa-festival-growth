-- Run in Supabase SQL editor
-- RISA Labs Growth APM Assignment: Festival Growth Command Center

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT,                  -- 'ambassador', 'instagram', 'direct', 'clubs', 'email'
  status TEXT DEFAULT 'active',  -- 'active', 'paused', 'stopped'
  budget_allocated NUMERIC DEFAULT 0,
  budget_spent NUMERIC DEFAULT 0,
  target_registrations INT DEFAULT 0,
  actual_registrations INT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  owner TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily metrics table (time-series funnel data)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  reach INT DEFAULT 0,
  registrations INT DEFAULT 0,
  attendees INT DEFAULT 0,
  cost_per_registration NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table (campaign management)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  owner TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',   -- 'pending', 'in_progress', 'done', 'blocked'
  priority TEXT DEFAULT 'medium',  -- 'high', 'medium', 'low'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Overall funnel targets table
CREATE TABLE IF NOT EXISTS funnel_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric TEXT NOT NULL,            -- 'reach', 'registrations', 'attendees'
  base_target INT,
  stretch_target INT,
  current_actual INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful index for time-series queries
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_campaign ON daily_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign ON tasks(campaign_id);

-- Enable Row Level Security with permissive policies for demo/assignment usage
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on campaigns" ON campaigns;
CREATE POLICY "Allow all operations on campaigns" ON campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on daily_metrics" ON daily_metrics;
CREATE POLICY "Allow all operations on daily_metrics" ON daily_metrics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on funnel_targets" ON funnel_targets;
CREATE POLICY "Allow all operations on funnel_targets" ON funnel_targets FOR ALL USING (true) WITH CHECK (true);

-- Seed funnel targets (idempotent reset option commented out)
INSERT INTO funnel_targets (metric, base_target, stretch_target, current_actual) VALUES
  ('reach', 83000, 150000, 0),
  ('registrations', 15000, 27000, 0),
  ('attendees', 10000, 18000, 0);

-- Seed campaigns
INSERT INTO campaigns (name, channel, budget_allocated, target_registrations, start_date, end_date, owner, notes) VALUES
  ('Campus Ambassador Program', 'ambassador', 40000, 6000, '2026-12-01', '2026-12-21', 'Riya', '1 ambassador per college x 40 Mumbai colleges; target 150 regs/ambassador'),
  ('Instagram Reel Contest', 'instagram', 15000, 2000, '2026-12-07', '2026-12-21', 'Aryan', 'UGC Reel campaign: Show your festival look, win free passes'),
  ('Free/Paid Ticket Split', 'direct', 0, 3000, '2026-11-28', '2026-12-21', 'Priya', '60% free general passes (email gate), 40% paid Rs 199 premium passes'),
  ('College Club Tie-ups', 'clubs', 10000, 2500, '2026-12-01', '2026-12-14', 'Kunal', 'Cultural committees, NSS, student bodies across 40 colleges; >20 group discount'),
  ('Email/WhatsApp Drip', 'email', 5000, 1500, '2026-12-14', '2026-12-21', 'Meera', 'Automated 7-day countdown drip to boost registrations & reduce show-up drop-off');
