-- Supabase認証問題のための完全クリーンアップと再構築スクリプト
-- 必ず「Service Role」権限で実行してください

-- ステップ1: 既存のprofilesテーブルをドロップ（クリーンスタート）
DROP TABLE IF EXISTS profiles;

-- ステップ2: 必要最小限のフィールドだけを持つシンプルなテーブルを作成
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  full_name TEXT,
  department TEXT,
  position TEXT,
  is_admin BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ステップ3: RLSを無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ステップ4: NULLトークンフィールド問題の修正
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;

-- ステップ5: テーブルに必要なデータだけを挿入（スクリーンショットのデータに基づく）
-- General Manager (Admin)
INSERT INTO profiles (id, username, full_name, department, position, is_admin)
SELECT id, 'Sakon Hiroki', 'Sakon Hiroki', 'Admin', 'General Manager', TRUE
FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk'
ON CONFLICT (id) DO UPDATE SET
  username = 'Sakon Hiroki',
  full_name = 'Sakon Hiroki', 
  department = 'Admin',
  position = 'General Manager',
  is_admin = TRUE;

-- Fty. Manager
INSERT INTO profiles (id, username, full_name, department, position, is_admin)
SELECT id, 'Wong Hong Keung', 'Wong Hong Keung', 'All Employees,Purchasing,Sales', 'Fty. Manager', FALSE
FROM auth.users WHERE email = 'alexwong@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;

-- S & M Manger
INSERT INTO profiles (id, username, full_name, department, position, is_admin)
SELECT id, 'Lau Cheuk Ming', 'Lau Cheuk Ming', 'All Employees,Sales', 'S & M Manger', FALSE
FROM auth.users WHERE email = 'billylau@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;

-- S & M Manageress
INSERT INTO profiles (id, username, full_name, department, position, is_admin)
SELECT id, 'Poon Kit Ling', 'Poon Kit Ling', 'All Employees,Sales', 'S & M Manageress', FALSE
FROM auth.users WHERE email = 'grace@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;

-- 確認: 管理者ユーザーが正しく設定されたかチェック
SELECT a.email, p.full_name, p.position, p.is_admin
FROM auth.users a
JOIN profiles p ON a.id = p.id
WHERE a.email = 'hiroki.sakon@kirii.com.hk';

-- 確認: すべてのNULLトークンが修正されたか検証
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens
FROM auth.users;
