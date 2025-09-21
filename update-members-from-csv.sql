-- 更新されたメンバー構成でデータベースを更新するSQLスクリプト
-- 必ず「Service Role」権限で実行してください

-- ステップ1: 削除されたユーザーを削除
-- Chung Sung Wan (vincent@kirii.com.hk) を削除
DELETE FROM auth.users WHERE email = 'vincent@kirii.com.hk';
DELETE FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'vincent@kirii.com.hk');

-- Li Mei Lin (christineli@kirii.com.hk) を削除
DELETE FROM auth.users WHERE email = 'christineli@kirii.com.hk';
DELETE FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'christineli@kirii.com.hk');

-- ステップ2: 名前が変更されたユーザーを更新
-- info6: Li Tsz King → Lee Ka Lin
UPDATE profiles 
SET full_name = 'Lee Ka Lin', username = 'Lee Ka Lin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'info6@kirii.com.hk');

-- ステップ3: 現在のメンバー構成でユーザーを確認・更新
-- ユーザー1: General Manager (Admin)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'hiroki.sakon@kirii.com.hk', crypt('sakon0201', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Sakon Hiroki", "is_admin": true}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー2: Fty. Manager
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'alexwong@kirii.com.hk', crypt('mVb{bZYXXUAk', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Wong Hong Keung", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー3: S & M Manager
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'billylau@kirii.com.hk', crypt('WR_UXu,xonn%', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lau Cheuk Ming", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー4: S & M Manageress
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'grace@kirii.com.hk', crypt('s8bSMVKifLuH', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Poon Kit Ling", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー5: Sales Executive
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'ivan@kirii.com.hk', crypt('UJbhlU1s6', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Ip Ting Hin", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー6: S &Ｍ Executive
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'anson@kirii.com.hk', crypt('AwD7ueNjkd', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lam Wai Lok", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー7: Project Manager
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'billyli@kirii.com.hk', crypt('ctBTiTbLoMsN1', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Li Pui Lok", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー8: Ass. Sales Manageress
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'kami@kirii.com.hk', crypt('FJRBd6R(WVMC', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Kit Yu Yi", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー9: Stock Keeper
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'ricky@kirii.com.hk', crypt('yL77CMA9hZA', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Cheng Tak Wong", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー10: Project Administrator
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'ada@kirii.com.hk', crypt(';foAqVgrDK0G', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Poon Hiu Yi", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー11: General Clerk
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'ralphlo@kirii.com.hk', crypt('c6%Oh0fzsB6J', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lo Leung Kei", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー12: General Clerk
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'tina@kirii.com.hk', crypt('pF2qhOiSyYCx', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Yeung Siu Tuen", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー13: General Clerk
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'brontem@kirii.com.hk', crypt('RHuB{sc9}5cC', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Mak Wan Hoi", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー14: Acc. Manager
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'irenewu@kirii.com.hk', crypt('8Ff!HU#j4!r1', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Wu Ka Yan", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー15: Worker
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'info1@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Yau Lai Yuk", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー16: Worker
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'info2@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Hui Oi Han", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー17: Technican
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'info3@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lin Daoqun", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー18: Supervisor
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'info4@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lam Wan Tat", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー19: Stock Keeper
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'info5@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Yau Siu Yin", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー20: Stock Keeper (名前変更: Li Tsz King → Lee Ka Lin)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'info6@kirii.com.hk', crypt('kirii-20250406', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lee Ka Lin", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ユーザー21: Head Office
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated',
  'japan@kirii.com.hk', crypt('kiriijp-012345', gen_salt('bf')),
  now(), now(), '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Japan Head Office", "is_admin": false}', now(), now(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- ステップ4: プロフィールを更新
-- 全ユーザーのプロフィールを更新
WITH user_data AS (
  SELECT 
    'hiroki.sakon@kirii.com.hk' as email, 'Sakon Hiroki' as full_name, 'Admin' as department, 'General Manager' as position, true as is_admin
  UNION ALL SELECT 'alexwong@kirii.com.hk', 'Wong Hong Keung', 'All Employees,Purchasing,Sales', 'Fty. Manager', false
  UNION ALL SELECT 'billylau@kirii.com.hk', 'Lau Cheuk Ming', 'All Employees,Sales', 'S & M Manager', false
  UNION ALL SELECT 'grace@kirii.com.hk', 'Poon Kit Ling', 'All Employees,Sales', 'S & M Manageress', false
  UNION ALL SELECT 'ivan@kirii.com.hk', 'Ip Ting Hin', 'All Employees,Sales', 'Sales Executive', false
  UNION ALL SELECT 'anson@kirii.com.hk', 'Lam Wai Lok', 'All Employees,Sales', 'S &Ｍ Executive', false
  UNION ALL SELECT 'billyli@kirii.com.hk', 'Li Pui Lok', 'All Employees,Sales', 'Project Manager', false
  UNION ALL SELECT 'kami@kirii.com.hk', 'Kit Yu Yi', 'All Employees,Sales', 'Ass. Sales Manageress', false
  UNION ALL SELECT 'ricky@kirii.com.hk', 'Cheng Tak Wong', 'All Employees', 'Stock Keeper', false
  UNION ALL SELECT 'ada@kirii.com.hk', 'Poon Hiu Yi', 'All Employees,Sales', 'Project Administrator', false
  UNION ALL SELECT 'ralphlo@kirii.com.hk', 'Lo Leung Kei', 'All Employees', 'General Clerk', false
  UNION ALL SELECT 'tina@kirii.com.hk', 'Yeung Siu Tuen', 'All Employees', 'General Clerk', false
  UNION ALL SELECT 'brontem@kirii.com.hk', 'Mak Wan Hoi', 'All Employees', 'General Clerk', false
  UNION ALL SELECT 'irenewu@kirii.com.hk', 'Wu Ka Yan', 'All Employees,Purchasing,Sales', 'Acc. Manager', false
  UNION ALL SELECT 'info1@kirii.com.hk', 'Yau Lai Yuk', 'All Employees', 'Worker', false
  UNION ALL SELECT 'info2@kirii.com.hk', 'Hui Oi Han', 'All Employees', 'Worker', false
  UNION ALL SELECT 'info3@kirii.com.hk', 'Lin Daoqun', 'All Employees', 'Technican', false
  UNION ALL SELECT 'info4@kirii.com.hk', 'Lam Wan Tat', 'All Employees', 'Supervisor', false
  UNION ALL SELECT 'info5@kirii.com.hk', 'Yau Siu Yin', 'All Employees', 'Stock Keeper', false
  UNION ALL SELECT 'info6@kirii.com.hk', 'Lee Ka Lin', 'All Employees', 'Stock Keeper', false
  UNION ALL SELECT 'japan@kirii.com.hk', 'Japan Head Office', 'All Employees,Purchasing,Sales', 'Head Office', false
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
)
SELECT 
  auth_users.id,
  user_data.full_name,
  user_data.full_name,
  user_data.department,
  user_data.position,
  user_data.is_admin,
  now()
FROM user_data
JOIN auth.users auth_users ON user_data.email = auth_users.email
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  is_admin = EXCLUDED.is_admin,
  updated_at = EXCLUDED.updated_at;

-- ステップ5: 確認
SELECT COUNT(*) AS total_users FROM auth.users;
SELECT COUNT(*) AS total_profiles FROM profiles;
SELECT full_name, email, department, position, is_admin FROM profiles ORDER BY full_name;


