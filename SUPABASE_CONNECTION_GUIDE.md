# Supabaseへの接続とSQLの実行方法

## 接続エラーについて

SQLを実行しようとした際に「Connection string is missing」というエラーが発生した場合、Supabaseへの接続設定が不足しています。

## 解決方法：Supabaseダッシュボードで直接SQLを実行する

最も確実な方法は、Supabaseのダッシュボードに直接ログインして、組み込みのSQLエディタを使用することです：

1. [Supabaseのダッシュボード](https://app.supabase.io/)にログインする
2. プロジェクト「mnshbcvrrzlumfomniim」を選択する
3. 左側メニューから「SQL Editor」を選択
4. 「+ New Query」ボタンをクリック
5. `insert-users-final.sql`の内容をコピーして貼り付け
6. 「Run」ボタンをクリックして実行

この方法では接続文字列を指定する必要はありません。Supabaseダッシュボード内では既に認証されているため、直接SQLを実行できます。

## Supabaseプロジェクト情報

アプリケーションコードから確認できたSupabaseプロジェクト情報：

```
URL: https://mnshbcvrrzlumfomniim.supabase.co
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M
```

## 代替手段：Supabase CLIを使用する

Supabase CLIがインストールされている場合は、以下のコマンドを使用してSQLを実行できます：

```bash
# Supabase CLIにログイン（初回のみ）
supabase login

# SQLファイルを実行
supabase db execute -f insert-users-final.sql --project-ref mnshbcvrrzlumfomniim
```

## 管理画面からユーザーを手動で追加する方法

SQLの実行に問題がある場合は、管理UIからユーザーを手動で追加することも可能です：

1. Supabaseダッシュボードにログイン
2. 左側メニューから「Authentication」→「Users」を選択
3. 「Add user」ボタンをクリック
4. メールアドレスとパスワードを入力して追加

プロフィール情報は以下の方法で追加できます：

1. 左側メニューから「Table Editor」→「profiles」を選択
2. 「Insert row」ボタンをクリック
3. 必要な情報を入力して保存

この方法は少数のユーザーには適していますが、多数のユーザーを追加する場合はSQLの方が効率的です。
