-- 一時的にRLSを無効化（テスト用）
-- Supabaseダッシュボードで「Service Role」権限で実行してください

-- profilesテーブルのRLSを無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- login_historyテーブルのRLSを無効化
ALTER TABLE login_history DISABLE ROW LEVEL SECURITY;

-- 確認用クエリ
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'login_history');

-- データが取得できるかテスト
SELECT COUNT(*) as profiles_count FROM profiles;
SELECT COUNT(*) as login_history_count FROM login_history;


