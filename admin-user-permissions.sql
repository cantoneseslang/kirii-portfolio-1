-- このSQLスクリプトは、既存のユーザー（hiroki.sakon@kirii.com.hk）に管理者権限を確実に付与します
-- このSQLはSupabaseのSQL Editorで実行する必要があります

-- プロファイルテーブルにis_admin列が存在することを確認
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        -- is_admin列が存在しない場合は追加
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ユーザーのメタデータを更新
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'
)
WHERE email = 'hiroki.sakon@kirii.com.hk';

-- プロフィールテーブルも更新
UPDATE profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk'
);

-- すべての権限が正しく設定されたか確認
SELECT 
  u.id, 
  u.email, 
  u.raw_user_meta_data->>'is_admin' as user_meta_is_admin,
  p.is_admin as profile_is_admin
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'hiroki.sakon@kirii.com.hk';

-- 既存ユーザーがない場合は新規作成
DO $$
DECLARE
  user_exists BOOLEAN;
  user_id UUID;
BEGIN
  -- ユーザーが存在するか確認
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk'
  ) INTO user_exists;

  IF NOT user_exists THEN
    -- ユーザーが存在しない場合は新規作成
    user_id := uuid_generate_v4();
    
    -- auth.usersテーブルに追加
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
      user_id,
      'authenticated',
      'authenticated',
      'hiroki.sakon@kirii.com.hk',
      crypt('sakon0201', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Hiroki Sakon", "is_admin": true}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    -- profilesテーブルに追加
    INSERT INTO profiles (
      id,
      full_name,
      department,
      position,
      is_admin,
      updated_at
    ) VALUES (
      user_id,
      'Hiroki Sakon',
      'Management',
      'Administrator',
      true,
      now()
    );
    
    RAISE NOTICE 'ユーザー hiroki.sakon@kirii.com.hk を新規作成し、管理者権限を付与しました';
  ELSE
    RAISE NOTICE 'ユーザー hiroki.sakon@kirii.com.hk は既に存在します。管理者権限を更新しました';
  END IF;
END $$;
