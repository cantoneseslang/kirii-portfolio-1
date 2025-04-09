-- 社員ユーザー情報をSupabaseに追加するためのSQLスクリプト
-- このSQLはSupabaseのSQL Editorで実行する必要があります

-- ユーザー1: 営業部門の社員
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
  'tanaka.yamada@kirii.com.hk',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Tanaka Yamada", "is_admin": false}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- ユーザー1のプロフィールを作成
INSERT INTO profiles (
  id,
  full_name,
  department,
  position,
  updated_at
) 
SELECT 
  id,
  'Tanaka Yamada',
  'Sales',
  'Sales Representative',
  now()
FROM auth.users
WHERE email = 'tanaka.yamada@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;

-- ユーザー2: マーケティング部門の社員
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
  'keiko.sato@kirii.com.hk',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Keiko Sato", "is_admin": false}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- ユーザー2のプロフィールを作成
INSERT INTO profiles (
  id,
  full_name,
  department,
  position,
  updated_at
) 
SELECT 
  id,
  'Keiko Sato',
  'Marketing',
  'Marketing Manager',
  now()
FROM auth.users
WHERE email = 'keiko.sato@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;

-- ユーザー3: 営業部門の部長
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
  'takeshi.suzuki@kirii.com.hk',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Takeshi Suzuki", "is_admin": false}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- ユーザー3のプロフィールを作成
INSERT INTO profiles (
  id,
  full_name,
  department,
  position,
  updated_at
) 
SELECT 
  id,
  'Takeshi Suzuki',
  'Sales',
  'Sales Director',
  now()
FROM auth.users
WHERE email = 'takeshi.suzuki@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;

-- ユーザー4: 経理部門の社員
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
  'yuki.nakamura@kirii.com.hk',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Yuki Nakamura", "is_admin": false}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- ユーザー4のプロフィールを作成
INSERT INTO profiles (
  id,
  full_name,
  department,
  position,
  updated_at
) 
SELECT 
  id,
  'Yuki Nakamura',
  'Finance',
  'Accountant',
  now()
FROM auth.users
WHERE email = 'yuki.nakamura@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;

-- ユーザー5: IT部門の社員
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
  'akira.ito@kirii.com.hk',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Akira Ito", "is_admin": false}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- ユーザー5のプロフィールを作成
INSERT INTO profiles (
  id,
  full_name,
  department,
  position,
  updated_at
) 
SELECT 
  id,
  'Akira Ito',
  'IT',
  'System Engineer',
  now()
FROM auth.users
WHERE email = 'akira.ito@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;
