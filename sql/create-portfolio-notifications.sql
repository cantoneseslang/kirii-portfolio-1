-- Portfolio in-app notifications (pq-form → dashboard popup)
-- Apply with Service Role in Supabase dashboard or via migration tooling.

CREATE TABLE IF NOT EXISTS portfolio_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'pq-form-production-order',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_portfolio_notifications_pending
  ON portfolio_notifications (lower(recipient_email))
  WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_portfolio_notifications_created_at
  ON portfolio_notifications (created_at DESC);

ALTER TABLE portfolio_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pending notifications" ON portfolio_notifications;
CREATE POLICY "Users can view own pending notifications" ON portfolio_notifications
  FOR SELECT USING (
    lower(recipient_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Users can acknowledge own notifications" ON portfolio_notifications;
CREATE POLICY "Users can acknowledge own notifications" ON portfolio_notifications
  FOR UPDATE USING (
    lower(recipient_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    lower(recipient_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

ALTER TABLE portfolio_notifications ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_portfolio_notifications_share_token
  ON portfolio_notifications (share_token)
  WHERE share_token IS NOT NULL;
