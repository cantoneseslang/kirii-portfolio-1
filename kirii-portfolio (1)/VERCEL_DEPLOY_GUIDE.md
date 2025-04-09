# Vercelデプロイガイド

このガイドでは、このNext.jsアプリケーションをVercelへデプロイする手順を説明します。

## 事前準備

1. [Vercel](https://vercel.com/)アカウントを持っていることを確認してください。
2. [GitHub](https://github.com/)アカウントを持っていることを確認してください。
3. [Supabase](https://supabase.com/)アカウントとプロジェクトを設定してください。

## デプロイ手順

### 1. GitHubリポジトリの作成

1. GitHub.comにログインします。
2. 「New repository」をクリックします。
3. リポジトリ名を入力します（例：`kirii-portfolio`）。
4. 「Create repository」をクリックします。
5. ローカルのプロジェクトフォルダ内で以下のコマンドを実行します：

```bash
git init
git add .
git commit -m "初回コミット"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/kirii-portfolio.git
git push -u origin main
```

### 2. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com/)にログインします。
2. 以下の設定でプロジェクトを使用します：
   - プロジェクト名: `kirii-port`
   - プロジェクトID: `mnshbcvrrzlumfomniim`
   - Project URL: `https://mnshbcvrrzlumfomniim.supabase.co`
   - API Keys:
     - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M`
     - Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgzOTYwOSwiZXhwIjoyMDU5NDE1NjA5fQ.zIIn4hdZxG_eMlNMtrD4dcnEWCv5duma7IXQVx-4x5c`
     - JWT Secret: `plKJI4nEh111c9enCsZweF/yzr+wZeGdeIWpoNu8sNiqPXb16CM0KoeA5/WzKNdPVjh+zqmYWOj1LCs+eFiHgw==`

### 3. Vercelでのデプロイ

#### A. Vercel CLIを使用したデプロイ（推奨）

1. Vercel CLIをグローバルにインストールします（すでに実行済み）：
   ```bash
   npm install -g vercel
   ```

2. プロジェクトディレクトリで以下のコマンドを実行してVercelにログインします：
   ```bash
   vercel login
   ```

3. 初めてVercelを使用する場合は、新しいチームを作成します：
   - チーム名：`KIRII`（最大32文字）
   - チームURL：`vercel.com/kirii`

4. プロジェクトをデプロイします：
   ```bash
   vercel
   ```
   
5. デプロイ設定の質問に答えます：
   - セットアップをスキップするか？ → No
   - プロジェクトディレクトリ → （そのままEnterを押す）
   - リンクする既存のプロジェクト → No（新規プロジェクトの場合）
   - プロジェクト名 → `kirii-portfolio`
   - チームを選択 → `KIRII`
   - ビルドコマンドをオーバーライドするか？ → No
   - 開発コマンドをオーバーライドするか？ → No
   - ディレクトリをオーバーライドするか？ → No
   
5. 環境変数を設定します：
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   # プロンプトに「https://mnshbcvrrzlumfomniim.supabase.co」と入力
   
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # プロンプトに「eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M」と入力
   
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   # プロンプトに「eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgzOTYwOSwiZXhwIjoyMDU5NDE1NjA5fQ.zIIn4hdZxG_eMlNMtrD4dcnEWCv5duma7IXQVx-4x5c」と入力
   
   vercel env add SUPABASE_JWT_SECRET
   # プロンプトに「plKJI4nEh111c9enCsZweF/yzr+wZeGdeIWpoNu8sNiqPXb16CM0KoeA5/WzKNdPVjh+zqmYWOj1LCs+eFiHgw==」と入力
   ```

6. 環境変数を適用するために再度デプロイします：
   ```bash
   vercel --prod
   ```

#### B. Vercelウェブサイトを使用したデプロイ（代替方法）

1. [Vercel](https://vercel.com/)にログインします。
2. 「New Project」をクリックします。
3. GitHubアカウントを連携し、`kirii-portfolio`リポジトリを選択します。
4. プロジェクト設定画面で以下の環境変数を追加します：
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://mnshbcvrrzlumfomniim.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgzOTYwOSwiZXhwIjoyMDU5NDE1NjA5fQ.zIIn4hdZxG_eMlNMtrD4dcnEWCv5duma7IXQVx-4x5c`
   - `SUPABASE_JWT_SECRET`: `plKJI4nEh111c9enCsZweF/yzr+wZeGdeIWpoNu8sNiqPXb16CM0KoeA5/WzKNdPVjh+zqmYWOj1LCs+eFiHgw==`
5. 「Deploy」ボタンをクリックします。

デプロイが完了すると、Vercelが自動的にプロジェクトのURLを生成します。このURLからアプリケーションにアクセスできます。

### 4. カスタムドメインの設定（オプション）

1. デプロイしたプロジェクトのダッシュボードで「Domains」タブをクリックします。
2. 「Add」をクリックして、使用したいドメインを入力します。
3. 画面の指示に従ってDNS設定を行います。

## デプロイ後の更新

GitHubリポジトリに変更をプッシュすると、Vercelは自動的に新しいバージョンをデプロイします。

```bash
git add .
git commit -m "更新内容の説明"
git push origin main
```

## トラブルシューティング

### ビルドエラーが発生する場合

1. Vercelダッシュボードの「Deployments」タブでエラーの詳細を確認します。
2. 環境変数が正しく設定されているか確認します。
3. 必要に応じてローカルで `next build` を実行してエラーを事前に検出します。

### Supabase接続エラーが発生する場合

1. 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しく設定されているか確認します。
2. Supabaseプロジェクトの設定でCORSが正しく設定されているか確認します。
3. Supabaseダッシュボードでデータベースの健全性を確認します。
