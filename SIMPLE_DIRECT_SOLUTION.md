# Supabase認証エラー修正手順（直接解決策）

## 問題の概要

「Database error querying schema」エラーは、Supabaseの認証システムと実際のユーザーデータの不整合が原因です。これを直接解決するには、Service Role権限でSQLを実行するだけです。

## 手順（5分で完了）

### 1. Supabaseダッシュボードにログイン
- [Supabaseダッシュボード](https://app.supabase.io/)にアクセス
- プロジェクト「mnshbcvrrzlumfomniim」を選択

### 2. SQLエディタでスクリプトを実行
- 左側メニューから「SQL Editor」を選択
- **必須**: 画面右上の権限設定を「**Service Role**」に変更
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

Supabaseでは、認証情報（auth.users）とプロフィール情報（profiles）が別々のテーブルで管理されています。このSQLスクリプトは両方のテーブルを適切に設定し、Row Level Security (RLS)ポリシーも修正します。

これにより、「Database error querying schema」エラーが解消され、既存のすべてのユーザーがすぐにログインできるようになります。
