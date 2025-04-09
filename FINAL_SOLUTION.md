# エクセル表のユーザーをSupabaseに登録する最終解決策

## 概要

エクセル表のユーザーデータをSupabaseにインポートするための最終的な手順をまとめました。

## Supabaseダッシュボードで直接SQLを実行する方法

1. [Supabaseのダッシュボード](https://app.supabase.io/)にログインする
2. プロジェクト「mnshbcvrrzlumfomniim」を選択する
3. 左側メニューから「SQL Editor」を選択
4. 「+ New Query」ボタンをクリック
5. `insert-users-final.sql`の内容をコピーして貼り付け
6. 「Run」ボタンをクリックして実行

※ SQLファイルには4ユーザー分のみ記載されていますが、同じパターンで残りのユーザーをコピーして追加できます。

## SQLファイルの内容

`insert-users-final.sql`は、Supabaseの認証システムの二層構造（auth.usersテーブルとprofilesテーブル）に対応したSQLです。各ユーザーに対して：

1. auth.usersテーブルにユーザーの認証情報を追加
2. profilesテーブルにユーザーのプロフィール情報を追加

## 失敗した場合の代替手段：管理UIから手動で追加

SQL実行が困難な場合は、Supabase管理画面から手動でユーザーを追加できます：

1. 「Authentication」→「Users」でユーザー認証情報を追加
2. 「Table Editor」→「profiles」でプロフィール情報を追加

## 注意点

1. **メールアドレスの重複**: 複数のユーザーが同じメールアドレス（info@kirii.com.hk）を使用している場合、info1@kirii.com.hk、info2@kirii.com.hk などのように変更してください。

2. **特殊文字を含むパスワード**: SQLでは特殊文字が適切に処理されます。

3. **認証システムの仕組み**: Supabaseでは認証情報（auth.users）とプロフィール情報（profiles）が分かれています。これにより、hiroki.sakon@kirii.com.hk のユーザーがログインできるのに、profilesテーブルにデータが表示されていない状況が発生します。

## 参考ファイル

- `insert-users-final.sql`: 実行用SQLスクリプト
- `SUPABASE_AUTH_EXPLANATION.md`: 認証システムの詳細説明
- `SUPABASE_CONNECTION_GUIDE.md`: 接続方法の詳細

これらのドキュメントをご確認いただき、問題が解決できない場合はSupabaseのサポートにお問い合わせください。
