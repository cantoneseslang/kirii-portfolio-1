# Supabase認証修正チートシート

## 認証エラー「Database error querying schema」の即時修正手順

### 1. Supabaseダッシュボードにアクセス
- [Supabaseダッシュボード](https://app.supabase.io/)にログイン
- プロジェクト「mnshbcvrrzlumfomniim」を選択

### 2. SQL実行（重要：Service Role権限で）
- 左側メニュー → 「SQL Editor」を選択
- **必須**: 右上の権限設定を「Service Role」に変更
- 「+ New Query」ボタンをクリック
- `fixed-user-auth-solution.sql`の内容をコピー＆ペースト
- 「Run」ボタンをクリック

### 3. 結果確認
- エラーがないことを確認
- ユーザー数とRLSポリシーが表示されていることを確認

### 4. アプリで確認
- ログイン画面に戻り、認証をテスト
- 例: hiroki.sakon@kirii.com.hk / sakon0201

## よくあるエラーと対策

### 権限エラー
- 権限が「Service Role」になっているか再確認

### テーブル構造エラー
```sql
-- テーブル再作成
DROP TABLE IF EXISTS profiles;
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  full_name TEXT,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### 特定ユーザーの問題
```sql
-- 問題ユーザーの削除と再作成
DELETE FROM auth.users WHERE email = 'example@email.com';

-- SQLで当該ユーザーだけ再作成
```

## 重要ポイント

1. auth.usersとprofilesの**両方**にデータが必要
2. RLSポリシーが正しく設定されていること
3. サービスロールを使用すること（通常権限では失敗）
4. パスワードの特殊文字は適切に処理されること

## 追加ユーザー作成パターン
```sql
-- 認証データ
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'new@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "New User", "is_admin": false}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- プロフィールデータ
WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'new@example.com'
)
INSERT INTO profiles (
  id, username, full_name, department, position, is_admin, updated_at
) 
SELECT 
  new_user.id, 'Username', 'Full Name', 'Department', 'Position', false, now()
FROM new_user
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  is_admin = EXCLUDED.is_admin,
  updated_at = EXCLUDED.updated_at;
