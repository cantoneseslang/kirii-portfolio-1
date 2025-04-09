# Supabase認証問題の解決手順

## 問題の診断

認証エラー「Database error querying schema」とユーザー登録・認証の問題は、以下の原因が考えられます：

1. **テーブル構造の問題**: profilesテーブルの構造が正しく設定されていない
2. **RLSポリシーの不備**: Row Level Security (RLS)ポリシーが適切に設定されていない
3. **認証データの不整合**: auth.usersテーブルとprofilesテーブルのデータが同期していない
4. **パスワードの特殊文字**: 特殊文字を含むパスワードが正しく処理されていない

## 解決手順

### 手順1: Supabaseダッシュボードにアクセス

1. [Supabaseダッシュボード](https://app.supabase.io/)にログインする
2. プロジェクト「mnshbcvrrzlumfomniim」を選択する

### 手順2: SQLスクリプトの実行

1. 左側メニューから「**SQL Editor**」を選択
2. **重要**: 画面右上の権限設定が「**Service Role**」になっていることを確認
   - これはエラーを回避するために重要な設定です
   - デフォルトでは「Authenticated」になっているため、明示的に変更する必要があります
3. 「+ New Query」ボタンをクリック
4. 提供した`fixed-user-auth-solution.sql`の内容をコピー＆ペースト
5. 「Run」ボタンをクリックして実行

### 手順3: 実行結果の確認

スクリプト実行後、以下を確認します：

1. エラーが表示されていないか
2. ユーザー数のカウントが表示されているか
3. RLSポリシーリストが表示されているか

正常に実行されると、すべてのユーザーがauth.usersテーブルとprofilesテーブルの両方に登録され、適切なRLSポリシーが設定されます。

## エラー対処法

### もし「権限エラー」が発生した場合：

- 権限設定が「Service Role」になっているか再確認
- Supabaseプロジェクトの所有者アカウントでログインしていることを確認

### もし「テーブル構造エラー」が発生した場合：

SQLスクリプトの最初の部分（CREATE TABLE〜）が正常に実行されていることを確認。問題が続く場合は、手動でテーブル構造を修正：

```sql
-- profilesテーブルの再作成（既存データは失われます）
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

### 特定のユーザーのみに問題がある場合：

問題のあるユーザーを個別に修正します：

```sql
-- auth.usersテーブルからユーザーを削除
DELETE FROM auth.users WHERE email = '問題のあるメールアドレス';

-- そのユーザーだけを再度追加するSQLを実行
```

## アプリケーションの動作確認

すべてのSQLが正常に実行された後：

1. アプリケーションに戻る
2. メールアドレスとパスワードでログインを試みる
   - 例: hiroki.sakon@kirii.com.hk / sakon0201

ログインに成功し、ダッシュボードが表示されれば問題は解決しています。

## ユーザーの追加方法

今後新しいユーザーを追加する場合は、同様のパターンでSQLを作成します：

1. auth.usersテーブルにユーザーを追加
2. 同じユーザーIDでprofilesテーブルにプロフィール情報を追加

fixed-user-auth-solution.sqlファイルのパターンに従って、新しいユーザー情報に置き換えてください。

## 問題の再発防止

今後同様の問題を防ぐために：

1. ユーザー登録はサービスロールでSQLを実行する
2. プロフィールデータとRLSポリシーを必ず設定する
3. パスワードに特殊文字が含まれる場合は適切にエスケープする

同様の問題が再発した場合は、このガイドに記載された手順を再度実行してください。
