-- 既存のユーザーを削除（オプション）
DELETE FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk';

-- ユーザーを作成（Supabase推奨の方法）
-- 注意: このSQLはSupabaseのSQL Editorで実行する必要があります
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
  '{"full_name": "Hiroki Sakon", "is_admin": true}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- プロフィールテーブルを作成（まだ存在しない場合）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT,
  position TEXT
);

-- プロフィールを作成
INSERT INTO profiles (
  id,
  full_name,
  department,
  position,
  updated_at
) 
SELECT 
  id,
  'Hiroki Sakon',
  'Management',
  'Administrator',
  now()
FROM auth.users
WHERE email = 'hiroki.sakon@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;

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

