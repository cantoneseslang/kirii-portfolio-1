-- このSQLはSupabaseダッシュボードのSQL Editorで「Service Role」権限で実行する必要があります
-- 残りのユーザー(14-23)を登録するためのSQLスクリプト

-- ユーザー14: General Clerk
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
  'brontem@kirii.com.hk',
  crypt('RHuB{sc9}5cC', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Mak Wan Hoi", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'brontem@kirii.com.hk'
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
  'Mak Wan Hoi',
  'Mak Wan Hoi',
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

-- ユーザー15: Acc. Manager
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
  'irenewu@kirii.com.hk',
  crypt('8FfIHU#j4!r1', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Wu Ka Yan", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'irenewu@kirii.com.hk'
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
  'Wu Ka Yan',
  'Wu Ka Yan',
  'All Employees,Purchasing,Sales',
  'Acc. Manager',
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

-- ユーザー16-19: Worker/Technican/Supervisor
-- 共通パスワードを持つユーザーたち
-- ユーザー16: Worker
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
  'info1@kirii.com.hk',
  crypt('kirii-20250406', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Yau Lai Yuk", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'info1@kirii.com.hk'
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
  'Yau Lai Yuk',
  'Yau Lai Yuk',
  'All Employees',
  'Worker',
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

-- ユーザー17: Worker
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
  'info2@kirii.com.hk',
  crypt('kirii-20250406', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Hui Oi Han", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'info2@kirii.com.hk'
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
  'Hui Oi Han',
  'Hui Oi Han',
  'All Employees',
  'Worker',
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

-- ユーザー18: Technican
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
  'info3@kirii.com.hk',
  crypt('kirii-20250406', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lin Daoqun", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'info3@kirii.com.hk'
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
  'Lin Daoqun',
  'Lin Daoqun',
  'All Employees',
  'Technican',
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

-- ユーザー19: Supervisor
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
  'info4@kirii.com.hk',
  crypt('kirii-20250406', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lam Wan Tat", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'info4@kirii.com.hk'
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
  'Lam Wan Tat',
  'Lam Wan Tat',
  'All Employees',
  'Supervisor',
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

-- ユーザー20: Stock Sup.
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
  'christineli@kirii.com.hk',
  crypt('YMz+&7c%WT0s', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Li Mei Lin", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'christineli@kirii.com.hk'
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
  'Li Mei Lin',
  'Li Mei Lin',
  'All Employees',
  'Stock Sup.',
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

-- ユーザー21-22: Stock Keeper（共通パスワード）
-- ユーザー21: Stock Keeper
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
  'info5@kirii.com.hk',
  crypt('kirii-20250406', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Yau Siu Yin", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'info5@kirii.com.hk'
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
  'Yau Siu Yin',
  'Yau Siu Yin',
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

-- ユーザー22: Stock Keeper
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
  'info6@kirii.com.hk',
  crypt('kirii-20250406', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Li Tsz King", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'info6@kirii.com.hk'
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
  'Li Tsz King',
  'Li Tsz King',
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

-- ユーザー23: Head Office
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
  'japan@kirii.com.hk',
  crypt('kiriijp-012345', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Japan Head Office", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'japan@kirii.com.hk'
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
  'Japan Head Office',
  'Japan Head Office',
  'All Employees,Purchasing,Sales',
  'Head Office',
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

-- 追加されたユーザー数を確認
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM profiles;
