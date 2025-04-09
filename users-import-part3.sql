-- CSVファイルから抽出したユーザーデータとパスワード (パート3: ユーザー17-23)
-- Service Roleで実行する必要があります
-- 注意: パート1、パート2を先に実行してください

BEGIN;

-- ユーザー17-23のデータを追加
-- 17. Hui Oi Han
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'info2@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Hui Oi Han"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('kirii-20250406', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 18. Lin Daoqun
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'info3@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Lin Daoqun"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('kirii-20250406', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 19. Lam Wan Tat
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'info4@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Lam Wan Tat"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('kirii-20250406', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 20. Li Mei Lin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'christineli@kirii.com.hk', crypt('YMz+&7c%WT0s', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Li Mei Lin"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('YMz+&7c%WT0s', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 21. Yau Siu Yin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'info5@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Yau Siu Yin"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('kirii-20250406', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 22. Li Tsz King
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'info6@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Li Tsz King"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('kirii-20250406', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- 23. Japan Head Office
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'japan@kirii.com.hk', crypt('kiriijp-012345', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Japan Head Office"}', now(), now())
ON CONFLICT (email) DO UPDATE SET encrypted_password = crypt('kiriijp-012345', gen_salt('bf')), email_confirmed_at = now(), updated_at = now();

-- ユーザー17-23のプロフィールを更新
-- 17. Hui Oi Han
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'info2@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Hui Oi Han', 'Hui Oi Han', 'All Employees', 'Worker', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Hui Oi Han',
  full_name = 'Hui Oi Han', 
  department = 'All Employees',
  position = 'Worker',
  is_admin = FALSE,
  updated_at = now();

-- 18. Lin Daoqun
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'info3@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Lin Daoqun', 'Lin Daoqun', 'All Employees', 'Technican', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Lin Daoqun',
  full_name = 'Lin Daoqun', 
  department = 'All Employees',
  position = 'Technican',
  is_admin = FALSE,
  updated_at = now();

-- 19. Lam Wan Tat
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'info4@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Lam Wan Tat', 'Lam Wan Tat', 'All Employees', 'Supervisor', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Lam Wan Tat',
  full_name = 'Lam Wan Tat', 
  department = 'All Employees',
  position = 'Supervisor',
  is_admin = FALSE,
  updated_at = now();

-- 20. Li Mei Lin
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'christineli@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Li Mei Lin', 'Li Mei Lin', 'All Employees', 'Stock Sup.', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Li Mei Lin',
  full_name = 'Li Mei Lin', 
  department = 'All Employees',
  position = 'Stock Sup.',
  is_admin = FALSE,
  updated_at = now();

-- 21. Yau Siu Yin
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'info5@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Yau Siu Yin', 'Yau Siu Yin', 'All Employees', 'Stock Keeper', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Yau Siu Yin',
  full_name = 'Yau Siu Yin', 
  department = 'All Employees',
  position = 'Stock Keeper',
  is_admin = FALSE,
  updated_at = now();

-- 22. Li Tsz King
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'info6@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Li Tsz King', 'Li Tsz King', 'All Employees', 'Stock Keeper', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Li Tsz King',
  full_name = 'Li Tsz King', 
  department = 'All Employees',
  position = 'Stock Keeper',
  is_admin = FALSE,
  updated_at = now();

-- 23. Japan Head Office
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'japan@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  user_data.id, 'Japan Head Office', 'Japan Head Office', 'All Employees,Purchasing,Sales', 'Head Office', FALSE, now()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  username = 'Japan Head Office',
  full_name = 'Japan Head Office', 
  department = 'All Employees,Purchasing,Sales',
  position = 'Head Office',
  is_admin = FALSE,
  updated_at = now();

-- ステップ6: 確認
SELECT 
  a.email, 
  p.full_name, 
  p.position, 
  p.is_admin
FROM auth.users a
JOIN profiles p ON a.id = p.id
ORDER BY p.is_admin DESC, a.email;

COMMIT;
