-- このSQLは直接ユーザーデータを挿入するためのものです
-- CSVインポートのエラーを回避するために、データを直接入力します

-- 既存のデータをバックアップ（オプション）
-- CREATE TABLE auth_users_backup AS SELECT * FROM auth.users;
-- CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- ユーザー1: General Manager (Admin)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  username,
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
  'Sakon Hiroki',
  crypt('sakon0201', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Sakon Hiroki", "is_admin": true}',
  now(),
  now()
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
  username,
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
  'Wong Hong Keung',
  crypt('mVb{bZYXXUAk', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Wong Hong Keung", "is_admin": false}',
  now(),
  now()
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

-- ユーザー3: S & M Manger
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  username,
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
  'Lau Cheuk Ming',
  crypt('WR_UXu,xonn%', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lau Cheuk Ming", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- ユーザー3のプロフィールを作成または更新
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

-- 残りのユーザーも同様に挿入できます
-- 以下は同じパターンを続けるだけです

-- 確認のためにユーザー数を表示
SELECT COUNT(*) AS total_users FROM auth.users;
SELECT COUNT(*) AS total_profiles FROM profiles;
