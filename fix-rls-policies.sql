-- Supabaseのテーブルアクセス権限とRLSポリシーを修正するためのSQL

-- 1. profilesテーブルのRLSを無効化（テスト用・本番環境では注意）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. または、適切なRLSポリシーを設定
-- 認証ユーザーが自分のプロファイルを読み取れるポリシー
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 認証ユーザーが自分のプロファイルを作成できるポリシー
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 認証ユーザーが自分のプロファイルを更新できるポリシー
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 3. サービスロールを使った直接操作用SQL（管理者実行用）
-- ※これはSupabaseのSQL Editorでサービスロール権限で実行する必要があります

-- Hiroki Sakonのプロファイルを作成/更新する
INSERT INTO profiles (id, full_name, is_admin)
VALUES ('3f77c95e-2068-42d1-a368-633c04f407d4', 'Hiroki Sakon', TRUE)
ON CONFLICT (id) 
DO UPDATE SET 
  is_admin = TRUE,
  full_name = 'Hiroki Sakon',
  updated_at = NOW();

-- プロファイルデータの確認
SELECT * FROM profiles WHERE id = '3f77c95e-2068-42d1-a368-633c04f407d4';
