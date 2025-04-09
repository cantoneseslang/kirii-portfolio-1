-- プロファイルテーブルが存在することを確認
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  department TEXT,
  position TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- プロファイルテーブルにis_adminカラムが存在することを確認
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 現在のユーザーのプロファイルを更新 (Hiroki Sakonのプロファイルがあると仮定)
UPDATE profiles 
SET is_admin = TRUE
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'user@example.com' -- ユーザーのメールアドレスに置き換える
);

-- プロファイルが存在しない場合は作成 (既存のIDsに対して)
INSERT INTO profiles (id, full_name, is_admin)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  TRUE as is_admin
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
AND email = 'user@example.com'; -- ユーザーのメールアドレスに置き換える

-- デバッグ用: プロファイルテーブルの内容を表示
SELECT * FROM profiles;
