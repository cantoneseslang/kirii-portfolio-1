-- このSQLはSupabaseダッシュボードのSQL Editorで「Service Role」権限で実行する必要があります
-- 残りのユーザーを登録するためのSQLスクリプト

-- ユーザー7: S &M Executive
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
  'anson@kirii.com.hk',
  crypt('AwD7ueNjkd', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lam Wai Lok", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'anson@kirii.com.hk'
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
  'Lam Wai Lok',
  'Lam Wai Lok',
  'All Employees,Sales',
  'S &M Executive',
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

-- ユーザー8: Project Manager
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
  'billyli@kirii.com.hk',
  crypt('ctBTiTbLoMsN1', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Li Pui Lok", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'billyli@kirii.com.hk'
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
  'Li Pui Lok',
  'Li Pui Lok',
  'All Employees,Sales',
  'Project Manager',
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

-- ユーザー9: Ass. Sales Manageress
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
  'kami@kirii.com.hk',
  crypt('FJRBd6R(WVMC', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Kit Yu Yi", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'kami@kirii.com.hk'
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
  'Kit Yu Yi',
  'Kit Yu Yi',
  'All Employees,Sales',
  'Ass. Sales Manageress',
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

-- ユーザー10: Stock Keeper
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
  'ricky@kirii.com.hk',
  crypt('yL77CMA9hZA', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Cheng Tak Wong", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'ricky@kirii.com.hk'
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
  'Cheng Tak Wong',
  'Cheng Tak Wong',
  'All Employees',
  'Stock Keeper',
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

-- ユーザー11: Project Administrator
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
  'ada@kirii.com.hk',
  crypt(';foAqVgrDK0G', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Poon Hiu Yi", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'ada@kirii.com.hk'
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
  'Poon Hiu Yi',
  'Poon Hiu Yi',
  'All Employees,Sales',
  'Project Administrator',
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

-- ユーザー12: General Clerk
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
  'ralphlo@kirii.com.hk',
  crypt('c6%Oh0fzsB6J', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lo Leung Kei", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'ralphlo@kirii.com.hk'
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
  'Lo Leung Kei',
  'Lo Leung Kei',
  'All Employees',
  'General Clerk',
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

-- ユーザー13: General Clerk
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
  'tina@kirii.com.hk',
  crypt('pF2qhOiSyYCx', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Yeung Siu Tuen", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'tina@kirii.com.hk'
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
  'Yeung Siu Tuen',
  'Yeung Siu Tuen',
  'All Employees',
  'General Clerk',
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

-- 残りのユーザーも同様に追加（ファイルサイズ制限のため分割）

-- データ検証
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM profiles;
