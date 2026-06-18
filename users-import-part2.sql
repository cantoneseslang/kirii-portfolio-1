-- CSVファイルから抽出したユーザーデータとパスワード (パート2: ユーザー9-16)
-- Service Roleで実行する必要があります
-- 注意: パート1を先に実行してください

BEGIN;

-- ユーザー9-16のデータを追加
-- 9. Kit Yu Yi
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'kami@kirii.com.hk', crypt('FJRBd6R(WVMC', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Kit Yu Yi"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('FJRBd6R(WVMC', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 10. Cheng Tak Wong
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'ricky@kirii.com.hk', crypt('yL77CMA9hZA', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Cheng Tak Wong"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('yL77CMA9hZA', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 11. Poon Hiu Yi
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'ada@kirii.com.hk', crypt(';foAqVgrDK0G', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Poon Hiu Yi"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt(';foAqVgrDK0G', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 12. Lo Leung Kei
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'ralphlo@kirii.com.hk', crypt('c6%Oh0fzsB6J', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Lo Leung Kei"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('c6%Oh0fzsB6J', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 13. Yeung Siu Tuen
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'tina@kirii.com.hk', crypt('pF2qhOiSyYCx', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Yeung Siu Tuen"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('pF2qhOiSyYCx', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 14. Mak Wan Hoi
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'brontem@kirii.com.hk', crypt('RHuB{sc9}5cC', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Mak Wan Hoi"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('RHuB{sc9}5cC', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 15. Wu Ka Yan
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'irenewu@kirii.com.hk', crypt('8Ff!HU#j4!r1', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Wu Ka Yan"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('8Ff!HU#j4!r1', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 16. Yau Lai Yuk
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'info1@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Yau Lai Yuk"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('kirii-20250406', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- ユーザー9-16のプロフィールを更新
-- 9. Kit Yu Yi
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'kami@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Kit Yu Yi', 'Kit Yu Yi', 'All Employees,Sales', 'Ass. Sales Manageress', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Kit Yu Yi',
  full_name = 'Kit Yu Yi', 
  department = 'All Employees,Sales',
  position = 'Ass. Sales Manageress',
  is_admin = FALSE,
  updated_at = now();

-- 10. Cheng Tak Wong
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'ricky@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Cheng Tak Wong', 'Cheng Tak Wong', 'All Employees', 'Stock Keeper', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Cheng Tak Wong',
  full_name = 'Cheng Tak Wong', 
  department = 'All Employees',
  position = 'Stock Keeper',
  is_admin = FALSE,
  updated_at = now();

-- 11. Poon Hiu Yi
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'ada@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Poon Hiu Yi', 'Poon Hiu Yi', 'All Employees,Sales', 'Project Administrator', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Poon Hiu Yi',
  full_name = 'Poon Hiu Yi', 
  department = 'All Employees,Sales',
  position = 'Project Administrator',
  is_admin = FALSE,
  updated_at = now();

-- 12. Lo Leung Kei
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'ralphlo@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Lo Leung Kei', 'Lo Leung Kei', 'All Employees,Sales', 'General Clerk', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Lo Leung Kei',
  full_name = 'Lo Leung Kei', 
  department = 'All Employees,Sales',
  position = 'General Clerk',
  is_admin = FALSE,
  updated_at = now();

-- 13. Yeung Siu Tuen
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'tina@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Yeung Siu Tuen', 'Yeung Siu Tuen', 'All Employees,Factory,Sales', 'General Clerk', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Yeung Siu Tuen',
  full_name = 'Yeung Siu Tuen', 
  department = 'All Employees,Factory,Sales',
  position = 'General Clerk',
  is_admin = FALSE,
  updated_at = now();

-- 14. Mak Wan Hoi
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'brontem@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Mak Wan Hoi', 'Mak Wan Hoi', 'All Employees', 'General Clerk', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Mak Wan Hoi',
  full_name = 'Mak Wan Hoi', 
  department = 'All Employees',
  position = 'General Clerk',
  is_admin = FALSE,
  updated_at = now();

-- 15. Wu Ka Yan
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'irenewu@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Wu Ka Yan', 'Wu Ka Yan', 'All Employees,Purchasing,Sales', 'Acc. Manager', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Wu Ka Yan',
  full_name = 'Wu Ka Yan', 
  department = 'All Employees,Purchasing,Sales',
  position = 'Acc. Manager',
  is_admin = FALSE,
  updated_at = now();

-- 16. Yau Lai Yuk
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'info1@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Yau Lai Yuk', 'Yau Lai Yuk', 'All Employees', 'Worker', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Yau Lai Yuk',
  full_name = 'Yau Lai Yuk', 
  department = 'All Employees',
  position = 'Worker',
  is_admin = FALSE,
  updated_at = now();

COMMIT;
