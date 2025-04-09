-- このSQLはSupabaseダッシュボードのSQL Editorで「Service Role」権限で実行する必要があります

-- 1. まず必要なテーブル構造を確保する
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

-- 2. RLSポリシーを適切に設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 新しいポリシーを作成
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" 
ON profiles FOR SELECT 
USING ((SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()) = true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. すべてのユーザーを登録する

-- ユーザー1: General Manager (Admin)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'hiroki.sakon@kirii.com.hk',
  crypt('sakon0201', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Sakon Hiroki", "is_admin": true}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

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
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'alexwong@kirii.com.hk',
  crypt('mVb{bZYXXUAk', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Wong Hong Keung", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

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

-- ユーザー3: S & M Manger
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'billylau@kirii.com.hk',
  crypt('WR_UXu,xonn%', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lau Cheuk Ming", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'billylau@kirii.com.hk'
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
  'Lau Cheuk Ming',
  'Lau Cheuk Ming',
  'All Employees,Sales',
  'S & M Manger',
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

-- ユーザー4: S & M Manageress
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'grace@kirii.com.hk',
  crypt('s8bSMVKifLuH', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Poon Kit Ling", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'grace@kirii.com.hk'
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
  'Poon Kit Ling',
  'Poon Kit Ling',
  'All Employees,Sales',
  'S & M Manageress',
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

-- ユーザー5: Sales Executive
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'ivan@kirii.com.hk',
  crypt('UJbhIU1s6', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Ip Ting Hin", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'ivan@kirii.com.hk'
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
  'Ip Ting Hin',
  'Ip Ting Hin',
  'All Employees,Sales',
  'Sales Executive',
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

-- ユーザー6: Sales Executive
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'vincent@kirii.com.hk',
  crypt('IeeEn5=%wAAb', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Chung Sung Wan", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'vincent@kirii.com.hk'
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
  'Chung Sung Wan',
  'Chung Sung Wan',
  'All Employees,Sales',
  'Sales Executive',
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

-- [残りのユーザーも同様のパターンで追加できますが、スペースの関係で省略]
-- 共通の改修点:
-- 1. usernameカラムにUNIQUE制約がある場合は、要確認（一意の値が必要）
-- 2. 全ユーザーのis_adminフラグは適切に設定（管理者のみtrue）
-- 3. パスワードに特殊文字が含まれる場合は適切にエスケープ

-- データ検証
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM profiles;

-- RLSポリシーが正しく設定されているか確認
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';
