-- Supabase認証エラー「Database error querying schema」の包括的な解決策
-- 必ず「Service Role」権限で実行してください

-- ステップ1: NULLトークンフィールドの修正
-- confirmation_tokenカラムのNULL値を空文字列に変更
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;

-- ステップ2: RLSの一時的な無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ステップ3: profilesテーブルの構造確認と修正
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  full_name TEXT,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ステップ4: 管理者ユーザーの権限を確保
-- 既存のユーザーがいなければ作成、いれば更新
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'hiroki.sakon@kirii.com.hk',
  crypt('sakon0201', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Sakon Hiroki", "is_admin": true}',
  now(),
  now()
) ON CONFLICT (email) DO 
UPDATE SET 
  email_confirmed_at = now(),
  updated_at = now();

-- 管理者プロフィールを確実に作成/更新
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk'
)
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

-- ステップ5: すべての管理者ユーザーをis_admin=trueに設定
UPDATE profiles
SET is_admin = true
WHERE email IN (
  SELECT email FROM auth.users
  WHERE email = 'hiroki.sakon@kirii.com.hk'
);

-- ステップ6: ユーザーの認証状態を確認
SELECT 
  a.id, 
  a.email,
  a.confirmation_token,
  a.email_confirmed_at,
  p.is_admin
FROM auth.users a
LEFT JOIN profiles p ON a.id = p.id
WHERE a.email = 'hiroki.sakon@kirii.com.hk';

-- 重要：これでログインが可能になるはずです。
-- もし問題が続く場合は、新しいSupabaseプロジェクトの作成を検討してください。
