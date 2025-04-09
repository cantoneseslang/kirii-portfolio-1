# Supabase認証エラー修正手順（正確なステップ）

## スクリーンショットの確認

スクリーンショットを確認すると、実際のインターフェースには「postgres role」があり、これが必要な権限設定です。

## 修正された手順（正確なステップ）

### 1. Supabaseダッシュボードにログイン
- [Supabaseダッシュボード](https://app.supabase.io/)にアクセス
- プロジェクト「mnshbcvrrzlumfomniim」を選択

### 2. SQLエディタでスクリプトを実行
- 左側メニューから「SQL Editor」を選択
- **必須**: 「Database role settings」から「**postgres role**」を選択（スクリーンショットの通り）
  - これは「デフォルトのPostgres/superuserロール」です
  - 「管理者権限」を持ち、「Row Level Security (RLS)ポリシーをバイパス」します
- 「+ New Query」ボタンをクリック
- `fixed-user-auth-solution.sql`の内容をコピー＆ペースト
- 「Run」ボタンをクリック

これだけで既存のユーザー（hiroki.sakon@kirii.com.hkなど）がログインできるようになります。
余分なテストページや修正コードは不要です。

### 3. 追加のユーザーが必要な場合

残りのユーザーも登録したい場合は、同様の手順で：
1. `all-users-import.sql`を実行（ユーザー7-13）
2. `all-users-import-part2.sql`を実行（ユーザー14-23）

## 確認方法

1. アプリにアクセス
2. 既存のアカウントでログイン（例：hiroki.sakon@kirii.com.hk / sakon0201）
3. 正常に認証されるかを確認

## なぜこれで解決するのか

Supabaseでは、認証情報（auth.users）とプロフィール情報（profiles）が別々のテーブルで管理されています。これらのテーブルへのアクセスには管理者権限が必要です。

「postgres role」設定を使用することで、Row Level Security (RLS)ポリシーをバイパスし、auth.usersテーブルを直接操作できるようになります。これにより「Database error querying schema」エラーが解消され、既存のすべてのユーザーがすぐにログインできるようになります。
