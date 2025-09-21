-- ログイン履歴のRLSポリシーを修正
-- Supabaseダッシュボードで「Service Role」権限で実行してください

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Admin can view all login history" ON login_history;
DROP POLICY IF EXISTS "Users can view own login history" ON login_history;
DROP POLICY IF EXISTS "System can insert login history" ON login_history;
DROP POLICY IF EXISTS "Authenticated users can view all login history" ON login_history;

-- 新しいポリシーを作成
-- 管理者は全履歴を閲覧可能
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

-- ログイン履歴の挿入ポリシー（重要！）
CREATE POLICY "System can insert login history" ON login_history
  FOR INSERT WITH CHECK (true);

-- 認証済みユーザーは全ログイン履歴を閲覧可能
CREATE POLICY "Authenticated users can view all login history" ON login_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- 確認用クエリ
SELECT 'RLS policies updated successfully' as status;


