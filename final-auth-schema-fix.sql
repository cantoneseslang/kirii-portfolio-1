-- Supabase認証エラー「Database error querying schema」の最終解決策
-- 必ず「Service Role」権限で実行してください

-- ステップ1: NULLトークンフィールドの修正（直接エラーを解決）
-- confirmation_tokenカラムのNULL値を空文字列に変更
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;

-- ステップ2: RLSの一時的な無効化（アクセス権限問題を解決）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ステップ3: 管理者ユーザーの状態を確保
-- hiroki.sakonユーザーのIDを取得
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk'
)
-- プロフィールを確実に作成/更新
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  admin_user.id, 'Sakon Hiroki', 'Sakon Hiroki', 'Admin', 'General Manager', TRUE, now()
FROM admin_user
ON CONFLICT (id) DO UPDATE SET
  username = 'Sakon Hiroki',
  full_name = 'Sakon Hiroki',
  department = 'Admin',
  position = 'General Manager',
  is_admin = TRUE,
  updated_at = now();

-- ステップ4: ユーザーの認証状態を確認
SELECT 
  a.id, 
  a.email,
  a.confirmation_token,
  a.email_confirmed_at,
  p.is_admin
FROM auth.users a
LEFT JOIN profiles p ON a.id = p.id
WHERE a.email = 'hiroki.sakon@kirii.com.hk';

-- ステップ5: すべてのNULLトークンが修正されたか確認
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
  COUNT(CASE WHEN email_change IS NULL THEN 1 END) as null_email_changes,
  COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as null_email_change_tokens,
  COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens
FROM auth.users;

-- 重要：これでログインが可能になるはずです
-- このSQLが実行されたら、アプリを再起動し、hiroki.sakon@kirii.com.hk / sakon0201でログインしてください
