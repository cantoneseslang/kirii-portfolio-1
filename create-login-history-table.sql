-- ログイン履歴テーブルの作成
-- Supabaseダッシュボードで「Service Role」権限で実行してください

-- ログイン履歴テーブル
CREATE TABLE IF NOT EXISTS login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  login_success BOOLEAN DEFAULT true,
  error_message TEXT,
  page_accessed TEXT DEFAULT '/dashboard'
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_timestamp ON login_history(login_timestamp);
CREATE INDEX IF NOT EXISTS idx_login_history_user_timestamp ON login_history(user_id, login_timestamp);

-- RLSポリシーの設定
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- 管理者のみが全履歴を閲覧可能
CREATE POLICY "Admin can view all login history" ON login_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ユーザーは自分の履歴のみ閲覧可能
CREATE POLICY "Users can view own login history" ON login_history
  FOR SELECT USING (user_id = auth.uid());

-- ログイン履歴の挿入ポリシー
CREATE POLICY "System can insert login history" ON login_history
  FOR INSERT WITH CHECK (true);

-- 確認用クエリ
SELECT 'Login history table created successfully' as status;


