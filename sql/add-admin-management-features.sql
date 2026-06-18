-- Admin management: employee active flag, per-card permissions, activity monitoring
-- Run in Supabase SQL editor (Service Role) or via apply_migration

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS card_permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  resource_key TEXT,
  resource_label TEXT,
  resource_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_resource_key ON activity_events(resource_key);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view all activity events" ON activity_events;
CREATE POLICY "Admin can view all activity events" ON activity_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can view own activity events" ON activity_events;
CREATE POLICY "Users can view own activity events" ON activity_events
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert activity events" ON activity_events;
CREATE POLICY "System can insert activity events" ON activity_events
  FOR INSERT WITH CHECK (true);
