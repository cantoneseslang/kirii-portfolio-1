# Vercelデプロイガイド

## 事前準備

1. [Vercel](https://vercel.com/)アカウント
2. [GitHub](https://github.com/)アカウント
3. [Supabase](https://supabase.com/)プロジェクト設定

## デプロイ手順

### 1. GitHubリポジトリの準備

```bash
git init
git add .
git commit -m "初回コミット"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/kirii-portfolio.git
git push -u origin main
```

### 2. Supabase設定の確認

プロジェクト情報：
- プロジェクト名: `kirii-port`
- プロジェクトID: `mnshbcvrrzlumfomniim`
- Project URL: `https://mnshbcvrrzlumfomniim.supabase.co`

### 3. Vercelデプロイ

#### A. Vercel CLIを使用（推奨）

1. CLIのインストールとログイン
```bash
npm install -g vercel
vercel login
```

2. プロジェクトのデプロイ
```bash
vercel
```

3. 環境変数の設定
```bash
# Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 入力: https://mnshbcvrrzlumfomniim.supabase.co

# Supabase Anon Key
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# 入力: [your-anon-key]

# Service Role Key
vercel env add SUPABASE_SERVICE_ROLE_KEY
# 入力: [your-service-role-key]

# JWT Secret
vercel env add SUPABASE_JWT_SECRET
# 入力: [your-jwt-secret]
```

4. 本番環境へのデプロイ
```bash
vercel --prod
```

#### B. Vercelウェブサイトを使用

1. [Vercel](https://vercel.com/)にログイン
2. 「New Project」をクリック
3. GitHubリポジトリを連携
4. 環境変数を設定
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
5. 「Deploy」をクリック

## デプロイ後の更新

コードを更新してデプロイする場合：

```bash
git add .
git commit -m "更新内容の説明"
git push origin main
```

Vercelは自動的に新しいバージョンをデプロイします。

## トラブルシューティング

### ビルドエラー
1. Vercelダッシュボードで「Deployments」タブを確認
2. 環境変数の設定を確認
3. ローカルで`next build`を実行してエラーを確認

### Supabase接続エラー
1. 環境変数の確認
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. CORSの設定確認
3. データベースの健全性確認

### デプロイ後の確認事項
1. 認証機能の動作確認
2. データベース接続の確認
3. 環境変数の反映確認

## セキュリティ注意事項

1. **環境変数の管理**
   - 本番環境の環境変数は必ずVercelダッシュボードで設定
   - ローカルの`.env`ファイルはGitにコミットしない

2. **APIキーの保護**
   - Service Role Keyは厳重に管理
   - Anon Keyのみを公開設定に使用

3. **デプロイ設定**
   - 本番環境では必ずHTTPS使用
   - 適切なCORS設定の確認 