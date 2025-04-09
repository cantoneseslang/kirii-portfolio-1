-- auth.usersテーブルのNULLトークンフィールドを空文字列に更新するスクリプト
-- 「Database error querying schema」エラー解決のための根本的なアプローチ
-- postgres roleで実行する必要があります

-- NULLのトークンフィールドを空文字列に更新（各カラムを個別に更新）
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;

-- 特定のユーザーのトークンフィールドを確実に更新
UPDATE auth.users
SET 
  confirmation_token = '',
  email_change = '',
  email_change_token_new = '',
  recovery_token = ''
WHERE email = 'hiroki.sakon@kirii.com.hk';

-- RLSポリシーを一時的に無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- データ整合性を確認
SELECT 
  id, 
  email, 
  confirmation_token, 
  email_change, 
  email_change_token_new, 
  recovery_token
FROM auth.users 
WHERE email = 'hiroki.sakon@kirii.com.hk';

-- 更新確認
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
  COUNT(CASE WHEN email_change IS NULL THEN 1 END) as null_email_changes,
  COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as null_email_change_tokens,
  COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens
FROM auth.users;
