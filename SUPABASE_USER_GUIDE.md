# Supabaseユーザー追加ガイド

このガイドでは、Supabaseに社員ユーザー情報を追加する方法を説明します。

## 前提条件

1. Supabaseアカウントへのアクセス権限
2. Supabaseプロジェクト管理者権限

## ステップ1: Supabaseダッシュボードにログイン

1. [Supabase](https://supabase.com/)にアクセスし、ログインします。
2. プロジェクト「kirii-port」を選択します。

## ステップ2: SQLエディタを開く

1. 左側のメニューから「SQL Editor」をクリックします。
2. 「New query」ボタンをクリックして、新しいSQLクエリを作成します。

## ステップ3: SQLを実行

1. 以下のいずれかのSQLファイルの内容をコピーします:
   - `create-user-with-working-password.sql`: 管理者ユーザー（Hiroki Sakon）を作成
   - `add-employee-users.sql`: 複数の社員ユーザーを追加

2. SQLエディタに貼り付けます。

3. 「Run」ボタンをクリックしてSQLを実行します。

## ステップ4: 実行結果を確認

1. 「Auth」→「Users」メニューから新しく追加されたユーザーを確認できます。
2. 「Table Editor」→「profiles」テーブルからプロフィール情報を確認できます。

## 追加したユーザーの認証情報

すべてのユーザーは以下の認証情報でログインできます:

| メールアドレス | パスワード |
|----------------|------------|
| hiroki.sakon@kirii.com.hk | sakon0201 |
| tanaka.yamada@kirii.com.hk | password123 |
| keiko.sato@kirii.com.hk | password123 |
| takeshi.suzuki@kirii.com.hk | password123 |
| yuki.nakamura@kirii.com.hk | password123 |
| akira.ito@kirii.com.hk | password123 |

## 追加したユーザーの部門情報

| 名前 | 部門 | 役職 |
|------|------|------|
| Hiroki Sakon | Management | Administrator |
| Tanaka Yamada | Sales | Sales Representative |
| Keiko Sato | Marketing | Marketing Manager |
| Takeshi Suzuki | Sales | Sales Director |
| Yuki Nakamura | Finance | Accountant |
| Akira Ito | IT | System Engineer |

## トラブルシューティング

- SQLの実行中にエラーが発生した場合は、エラーメッセージを確認して問題を修正してください。
- 一般的なエラーには、重複するメールアドレスや、テーブル構造の変更などがあります。
- エラーが解決しない場合は、Supabaseのドキュメントを参照するか、管理者に連絡してください。
