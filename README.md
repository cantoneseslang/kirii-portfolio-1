# My V0 Project

Next.jsとSupabaseを使用したウェブアプリケーションです。

## 機能

- ユーザー認証（Supabase Auth）
- ダッシュボード
- 管理者ページ
- プロフィール設定

## 技術スタック

- Next.js 15
- React 19
- Tailwind CSS
- Shadcn UI
- Supabase（認証・データベース）

## 環境変数の設定

プロジェクトルートに`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Supabaseの対象プロジェクト情報とMCP接続先は `SUPABASE_PROJECT_RECORD.md` に固定記録しています。

## ローカル開発

```bash
# 依存関係のインストール
npm install
# または
pnpm install

# 開発サーバーの起動
npm run dev
# または
pnpm dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## Vercelへのデプロイ方法

1. [Vercel](https://vercel.com)にアカウントを作成またはログインします。

2. 新しいプロジェクトを作成し、GitHubリポジトリを連携します。

3. 環境変数の設定：
   - `NEXT_PUBLIC_SUPABASE_URL` - SupabaseプロジェクトのURL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabaseの匿名キー

4. デプロイを実行すると、自動的にビルドとデプロイが行われます。

## 注意事項

- このプロジェクトはSupabaseを使用しています。Supabaseプロジェクトの設定が必要です。
- `.env.local`ファイルはgitにコミットしないでください（`.gitignore`に記載済み）。
