-- CSVファイルから抽出したユーザーデータとパスワード (パート1: ユーザー1-8)
-- Service Roleで実行する必要があります

BEGIN;

-- ステップ1: 既存のプロフィールテーブルをドロップし再作成
DROP TABLE IF EXISTS profiles;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  full_name TEXT,
  department TEXT,
  position TEXT,
  is_admin BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ステップ2: RLSを無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ステップ3: NULLトークンフィールド問題の修正
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;

-- ステップ4: CSVからのユーザーデータ - ユーザー1-8を追加
-- 1. Sakon Hiroki (管理者)
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
  encrypted_password = crypt('sakon0201', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- 2. Wong Hong Keung
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'alexwong@kirii.com.hk',
  crypt('mVb{bZYXXUAk', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Wong Hong Keung"}',
  now(),
  now()
) ON CONFLICT (email) DO 
UPDATE SET 
  encrypted_password = crypt('mVb{bZYXXUAk', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- 3. Lau Cheuk Ming
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'billylau@kirii.com.hk',
  crypt('WR_UXu,xonn%', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lau Cheuk Ming"}',
  now(),
  now()
) ON CONFLICT (email) DO 
UPDATE SET 
  encrypted_password = crypt('WR_UXu,xonn%', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- 4. Poon Kit Ling
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'grace@kirii.com.hk',
  crypt('s8bSMVKifLuH', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Poon Kit Ling"}',
  now(),
  now()
) ON CONFLICT (email) DO 
UPDATE SET 
  encrypted_password = crypt('s8bSMVKifLuH', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- 5. Ip Ting Hin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'ivan@kirii.com.hk', crypt('UJbhlU1s6', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Ip Ting Hin"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('UJbhlU1s6', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 6. Chung Sung Wan
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'vincent@kirii.com.hk', crypt('!eeEn5=%wAAb', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Chung Sung Wan"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('!eeEn5=%wAAb', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 7. Lam Wai Lok
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'anson@kirii.com.hk', crypt('AwD7ueNjkd', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Lam Wai Lok"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('AwD7ueNjkd', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 8. Li Pui Lok
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'billyli@kirii.com.hk', crypt('ctBTiTbLoMsN1', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Li Pui Lok"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('ctBTiTbLoMsN1', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- ステップ5: プロフィールテーブル更新 - ユーザー1-8のプロフィール
-- 1. Sakon Hiroki (管理者)
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

-- 2. Wong Hong Keung
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'alexwong@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Wong Hong Keung', 'Wong Hong Keung', 'All Employees,Purchasing,Sales', 'Fty. Manager', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Wong Hong Keung',
  full_name = 'Wong Hong Keung', 
  department = 'All Employees,Purchasing,Sales',
  position = 'Fty. Manager',
  is_admin = FALSE,
  updated_at = now();

-- 3. Lau Cheuk Ming
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'billylau@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Lau Cheuk Ming', 'Lau Cheuk Ming', 'All Employees,Sales', 'S & M Manger', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Lau Cheuk Ming',
  full_name = 'Lau Cheuk Ming', 
  department = 'All Employees,Sales',
  position = 'S & M Manger',
  is_admin = FALSE,
  updated_at = now();

-- 4. Poon Kit Ling
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'grace@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Poon Kit Ling', 'Poon Kit Ling', 'All Employees,Sales', 'S & M Manageress', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Poon Kit Ling',
  full_name = 'Poon Kit Ling', 
  department = 'All Employees,Sales',
  position = 'S & M Manageress',
  is_admin = FALSE,
  updated_at = now();

-- 5. Ip Ting Hin
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'ivan@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Ip Ting Hin', 'Ip Ting Hin', 'All Employees,Sales', 'Sales Executive', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Ip Ting Hin',
  full_name = 'Ip Ting Hin', 
  department = 'All Employees,Sales',
  position = 'Sales Executive',
  is_admin = FALSE,
  updated_at = now();

-- 6. Chung Sung Wan
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'vincent@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Chung Sung Wan', 'Chung Sung Wan', 'All Employees,Sales', 'Sales Executive', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Chung Sung Wan',
  full_name = 'Chung Sung Wan', 
  department = 'All Employees,Sales',
  position = 'Sales Executive',
  is_admin = FALSE,
  updated_at = now();

-- 7. Lam Wai Lok
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'anson@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Lam Wai Lok', 'Lam Wai Lok', 'All Employees,Sales', 'S &Ｍ Executive', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Lam Wai Lok',
  full_name = 'Lam Wai Lok', 
  department = 'All Employees,Sales',
  position = 'S &Ｍ Executive',
  is_admin = FALSE,
  updated_at = now();

-- 8. Li Pui Lok
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'billyli@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Li Pui Lok', 'Li Pui Lok', 'All Employees,Sales', 'Project Manager', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Li Pui Lok',
  full_name = 'Li Pui Lok', 
  department = 'All Employees,Sales',
  position = 'Project Manager',
  is_admin = FALSE,
  updated_at = now();

COMMIT;
