-- CSVファイルから抽出した完全なユーザーデータとパスワードでのインポートSQL
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

-- ステップ4: CSVからのユーザーデータ - 全23名のユーザーを追加
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


-- ステップ5: プロフィールテーブル更新 - 全23ユーザーのプロフィール
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
  SELECT id FROM auth
