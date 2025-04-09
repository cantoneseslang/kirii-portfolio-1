# Supabaseのユーザーインポート - サービスロール解決策

## 問題の本質

前回のエラー「Database error querying schema」と現在の問題は、Supabaseの認証とアクセス権限の仕組みに関連しています。これらの問題を適切に解決するには、**サービスロール（Service Role）** を使用したアプローチが必要です。

## サービスロールとは

サービスロールは、Supabaseの特別な権限モードで、Row Level Security (RLS)のポリシーをバイパスしてデータを操作できます。通常の操作では、セキュリティ上の理由からさまざまな制限がありますが、サービスロールを使用すると、これらの制限を回避できます。

## 解決策: サービスロールでSQLを実行する

1. Supabaseダッシュボードにログイン
2. 左側メニューから「SQL Editor」を選択
3. 画面右上の権限設定から「**Service Role**」を選択（重要！）
4. `working-user-import.sql`または以下のSQLを実行

```sql
-- RLSをバイパスしてプロフィールを直接作成/更新するためのSQL

-- プロフィールテーブルのセットアップ
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 適切なRLSポリシーの設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの再作成
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" 
ON profiles FOR SELECT 
USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Hiroki Sakon (管理者) のプロフィールを作成/更新
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
) ON CONFLICT (email) DO NOTHING;

-- 管理者プロフィールの作成
WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  new_user.id, 'Sakon Hiroki', 'Sakon Hiroki', 'Admin', 'General Manager', TRUE, now()
FROM new_user
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  is_admin = TRUE,
  updated_at = EXCLUDED.updated_at;
```

## RLSポリシーとサービスロールの関係

Supabaseでは、セキュリティのためにRow Level Security (RLS)を使用しています。これにより：

1. 通常のユーザーは自分のデータのみにアクセスできる
2. 管理者は追加の権限を持てる
3. アプリケーションは適切な権限チェックを実行できる

しかし、プロフィールデータやRLSポリシーがない場合、認証システムが正しく機能しません。サービスロールを使用すると、これらの問題を回避できます。

## 管理者権限の反映問題

管理者ステータス（is_admin = TRUE）がアプリケーションに反映されない問題は、以下の原因が考えられます：

1. プロフィールデータが存在しない
2. RLSポリシーが正しく設定されていない
3. アプリケーションがデータを正しく読み込めていない

解決策として、以下を実施しています：

1. サービスロールでプロフィールデータを直接作成/更新
2. 適切なRLSポリシーを設定（特に管理者用のポリシー）
3. is_adminフラグを明示的にTRUEに設定

## 今後同様の問題が発生した場合

1. Supabaseダッシュボードで「SQL Editor」を開く
2. 権限を「Service Role」に設定
3. profiles テーブルのデータを確認：`SELECT * FROM profiles;`
4. 必要に応じて、管理者プロファイルを修正：
   ```sql
   UPDATE profiles 
   SET is_admin = TRUE 
   WHERE id = '該当するユーザーID';
   ```
5. アプリケーションの「管理者ステータスデバッガー」ツールで「接続更新&データ再取得」を実行

## より深いSupabase理解のために

Supabaseのセキュリティモデルは複雑ですが、理解すると強力です：

- **Row Level Security (RLS)**: どのユーザーがどのデータにアクセスできるかを制御
- **サービスロール**: RLSをバイパスして管理操作を実行できる特権
- **メタデータとプロフィール**: auth.usersテーブルとprofilesテーブルの連携

これらの概念を理解することで、より安全で効率的なアプリケーション構築が可能になります。
