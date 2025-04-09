-- このSQLスクリプトは動作確認済みのcreate-user-with-working-password.sqlに基づいています
-- Database error querying schemaのエラーを修正するため、必要なRLSポリシーを含めています

-- プロフィールテーブルを確認（まだ存在しない場合は作成）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT,
  position TEXT,
  is_admin BOOLEAN DEFAULT false
);

-- セキュリティのためのRLS（Row Level Security）ポリシーを設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーが自分のプロフィールのみを参照できるポリシー
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 認証されたユーザーが自分のプロフィールのみを更新できるポリシー
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 認証されたユーザーが自分のプロフィールを挿入できるポリシー
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 管理者が全プロフィールを表示できるポリシー
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" 
ON profiles FOR SELECT 
USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- ユーザー1: General Manager (Admin)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'hiroki.sakon@kirii.com.hk',
  crypt('sakon0201', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Sakon Hiroki", "is_admin": true}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー1のプロフィールを作成または更新
WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk'
)
INSERT INTO profiles (
  id,
  username,
  full_name,
  department,
  position,
  is_admin,
  updated_at
) 
SELECT 
  new_user.id,
  'Sakon Hiroki',
  'Sakon Hiroki',
  'Admin',
  'General Manager',
  true,
  now()
FROM new_user
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  is_admin = EXCLUDED.is_admin,
  updated_at = EXCLUDED.updated_at;

-- ユーザー2: Fty. Manager
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'alexwong@kirii.com.hk',
  crypt('mVb{bZYXXUAk', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Wong Hong Keung", "is_admin": false}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー2のプロフィールを作成または更新
WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'alexwong@kirii.com.hk'
)
INSERT INTO profiles (
  id,
  username,
  full_name,
  department,
  position,
  is_admin,
  updated_at
) 
SELECT 
  new_user.id,
  'Wong Hong Keung',
  'Wong Hong Keung',
  'All Employees,Purchasing,Sales',
  'Fty. Manager',
  false,
  now()
FROM new_user
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  is_admin = EXCLUDED.is_admin,
  updated_at = EXCLUDED.updated_at;

-- 確認のためにユーザー数を表示
SELECT COUNT(*) AS total_users FROM auth.users;
SELECT COUNT(*) AS total_profiles FROM profiles;
