-- Supabase「postgres role」権限で実行するSQL
-- データベースエラー「Database error querying schema」を修正するためのスクリプト

-- 1. RLSを一時的に無効化（開発中のテスト用）
-- 注意: 本番環境では推奨されません
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. または、適切なRLSポリシーを設定
-- まず既存のポリシーをクリア
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles access" ON profiles;

-- 認証されたユーザーが自分のプロファイルを閲覧できるポリシー
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 認証されたユーザーが自分のプロファイルを更新できるポリシー
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 認証されたユーザーが自分のプロファイルを作成できるポリシー
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 管理者が全てのプロファイルを閲覧できるポリシー
CREATE POLICY "Admin can view all profiles" 
ON profiles FOR SELECT 
USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- 3. 必要に応じて、既存のプロファイルが無い場合にプロファイルを作成
INSERT INTO profiles (id, username, full_name, department, position, is_admin)
SELECT id, 'admin_user', 'Hiroki Sakon', 'Admin', 'General Manager', true
FROM auth.users
WHERE email = 'hiroki.sakon@kirii.com.hk'
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  username = 'admin_user',
  full_name = 'Hiroki Sakon',
  department = 'Admin',
  position = 'General Manager',
  updated_at = now();

-- 4. profilesテーブルのRLSが有効かどうかを確認
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';

-- 5. profilesテーブルに設定されているRLSポリシーを確認
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';
