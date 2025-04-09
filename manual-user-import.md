# Supabaseユーザーインポート - 手動追加ガイド

CSVインポートで問題が発生している場合、以下の2つの確実な方法でユーザーデータを追加できます。

## 方法1: SQLで直接挿入する

直接SQLを実行してユーザーを追加する方法です。これはCSVインポートのエラーを回避し、確実にデータを追加できます。

### 手順

1. Supabaseダッシュボードにログイン
2. 左側メニューから「SQL Editor」を選択
3. 「+ New Query」ボタンをクリック
4. `direct-insert-users.sql`の内容をコピーして実行

```sql
-- ユーザーとプロフィールを直接挿入する例（完全なSQLはdirect-insert-users.sqlを参照）
INSERT INTO auth.users (
  -- フィールド指定
) VALUES (
  -- 値指定
) ON CONFLICT (email) DO NOTHING;

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'example@email.com'
)
INSERT INTO profiles (
  -- フィールド指定
) 
SELECT 
  -- 値指定
FROM new_user
ON CONFLICT (id) DO UPDATE SET
  -- 更新内容指定
;
```

この方法では一度に全ユーザーを追加するのではなく、数人ずつ追加すると安全です。

## 方法2: 管理UIから手動で追加する

Supabaseの管理UIを使用して、ユーザーを1人ずつ手動で追加する方法です。

### 手順

1. **ユーザー認証情報の追加**
   - Supabaseダッシュボードにログイン
   - 左側メニューから「Authentication」→「Users」を選択
   - 「Invite user」または「Add user」ボタンをクリック
   - 各ユーザーのメールアドレスとパスワードを入力
   - 「Save」または「Add」ボタンをクリック

2. **プロフィール情報の追加**
   - 左側メニューから「Table Editor」→「profiles」を選択
   - 「Insert row」または「+」ボタンをクリック
   - 以下の情報を入力：
     - `id`: 追加したユーザーのID（Auth → Usersで確認）
     - `username`: ユーザー名（例: `Sakon Hiroki`）
     - `full_name`: フルネーム（例: `Sakon Hiroki`）
     - `department`: 部門（例: `Admin`）
     - `position`: 役職（例: `General Manager`）
     - `is_admin`: 管理者フラグ（最初のユーザーはtrue、他はfalse）
     - `updated_at`: 現在日時
   - 「Save」または「Insert」ボタンをクリック

### ユーザーID（UUID）の確認方法

プロフィール追加時に必要なユーザーIDを確認する方法：

1. 「Authentication」→「Users」を選択
2. ユーザーの行をクリックして詳細を表示
3. 表示されたユーザー詳細でIDをコピー

または、以下のSQLを実行してIDを確認：

```sql
SELECT id, email FROM auth.users;
```

## 特殊なケースの対処方法

### info@kirii.com.hkが複数ある場合

複数のユーザーが同じメールアドレスを使用している問題は、以下のように一意のアドレスに変更してください：

- info@kirii.com.hk → info1@kirii.com.hk
- info@kirii.com.hk → info2@kirii.com.hk
- 以下同様

### 特殊文字を含むパスワード

パスワードに特殊文字が含まれている場合、SQLの`crypt()`関数を使用して適切にハッシュ化できます。SQLの方法を使う場合は`direct-insert-users.sql`の形式に従ってください。

## トラブルシューティング

### SQLエラーが発生する場合

- エラーメッセージを確認し、構文の問題やデータ型の不一致がないか確認
- 最初に少数のユーザーだけでテスト
- バックアップを取ってから実行

### ユーザーはあるがプロフィールがない場合

既にユーザーが認証テーブルに存在するが、プロフィールがない場合は以下のSQLで追加：

```sql
INSERT INTO profiles (
  id,
  username,
  full_name,
  department,
  position,
  is_admin,
  updated_at
)
SELECT 
  id,
  email,  -- usernameとしてemailを使用
  raw_user_meta_data->>'full_name',
  'Default Department',  -- デフォルト値を設定
  'Default Position',    -- デフォルト値を設定
  (raw_user_meta_data->>'is_admin')::boolean,
  now()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
);
