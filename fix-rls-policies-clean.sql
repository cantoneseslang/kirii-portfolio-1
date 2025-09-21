-- RLSポリシーを完全にリセットして再作成
-- Supabaseダッシュボードで「Service Role」権限で実行してください

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Admin can view all login history" ON login_history;
DROP POLICY IF EXISTS "Users can view own login history" ON login_history;
DROP POLICY IF EXISTS "System can insert login history" ON login_history;
DROP POLICY IF EXISTS "Authenticated users can view all login history" ON login_history;

-- 新しいポリシーを作成
-- profilesテーブル
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- 認証済みユーザーは全プロフィールを閲覧可能（テスト用）
CREATE POLICY "Authenticated users can view all profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- login_historyテーブル
CREATE POLICY "Admin can view all login history" ON login_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view own login history" ON login_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert login history" ON login_history
  FOR INSERT WITH CHECK (true);

-- 認証済みユーザーは全ログイン履歴を閲覧可能（テスト用）
CREATE POLICY "Authenticated users can view all login history" ON login_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- 確認用クエリ
SELECT 'RLS policies updated successfully' as status;
