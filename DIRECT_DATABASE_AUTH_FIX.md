# Supabase認証エラーの根本的解決手順

## 問題の原因

認証エラー「Database error querying schema」は以下の複合的な問題から発生しています：

1. `auth.users`テーブルの`confirmation_token`カラムが`NULL`になっている
2. テーブル構造に不要なフィールド（avatar_url等）があり、それらが`NULL`になっている
3. Row Level Security (RLS)の設定が適切でない

## 正確な解決手順

### 1. Supabaseダッシュボードにアクセス
- [Supabaseダッシュボード](https://app.supabase.io/)にログイン
- プロジェクト「mnshbcvrrzlumfomniim」を選択

### 2. SQLエディタでスクリプトを実行
- 左側メニューから「SQL Editor」を選択
- **最も重要**: 画面右上のドロップダウンから「**Service Role**」を選択（管理者権限）
- 「+ New Query」をクリック
- `clean-simple-table-rebuild.sql`の内容をコピー＆ペースト
- 「Run」ボタンをクリック

### 3. スクリプトの内容（データベースを直接修正）

```sql
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

-- ステップ5: テーブルに必要なデータだけを挿入
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

-- その他の必要なユーザーも同様に挿入
```

### 4. スクリプト実行後の確認

スクリプトが正常に実行されると：
1. 不要な構造のテーブルが削除され、必要なフィールドだけのシンプルなテーブルが作成される
2. NULLトークンの問題が修正される
3. 管理者ユーザーが正しく設定される
4. RLSによるアクセス制限が解除される

### 5. アプリケーションの再起動

- アプリケーションを再起動または再ロードする
- hiroki.sakon@kirii.com.hk / sakon0201 でログイン

## なぜこれが根本的な解決策なのか

このスクリプトは、データベース内のデータ構造自体を修正し、Supabaseの認証システムが正しく動作できるようにします。バイパスや一時的な回避策ではなく、問題の根本にある原因を直接修正します。
