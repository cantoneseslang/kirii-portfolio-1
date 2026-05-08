### Vercel デプロイ情報（固定メモ）

- プロジェクト: kirii-portfolio-1
- ダッシュボード: https://vercel.com/kirii/kirii-portfolio-1
- Project ID: prj_X7LnsilGrrKFX90tKrLgkYf9ZSlg
- 固定ドメイン: https://kirii-portfolio-1.vercel.app

#### 必須環境変数（Production/Preview/Development 全てに設定）

**値は Vercel ダッシュボードにのみ保存すること。リポジトリに書かない。**

- `OAUTH_CLIENT_ID`: Google Cloud が発行する OAuth クライアント ID
- `OAUTH_CLIENT_SECRET`: Google Cloud のクライアントシークレット（機密）
- `OAUTH_REDIRECT_URI`: 例 `http://localhost`（環境に合わせて設定）
- `TARGET_FOLDER_ID`: Google ドライブのフォルダ ID
- `GOOGLE_DRIVE_TOKEN`: `oauth_tokens.json` の JSON 全文（先頭/末尾に余計な文字を付けない）

#### デプロイトークン

Personal Token は Vercel の Account Settings → Tokens で発行。平文でリポジトリに置かない。

#### デプロイ手順（CLI）

1) vercel にログイン

```bash
npm i -g vercel
vercel login
```

2) デプロイ

```bash
# プレビュー
vercel --yes
# 本番
vercel --prod --yes
```

（Git 連携がある場合は git push で自動デプロイ）

#### 動作確認

- `https://<deployment-url>/api/files` → JSON で `{ success: true, categories: {...} }`
- `https://<deployment-url>/certification` → 認證文件のフォルダ/ファイル表示

#### トラブルシュート

- `GOOGLE_DRIVE_TOKEN` が正しい JSON か
- OAuth アカウントが `TARGET_FOLDER_ID` を閲覧可能か
- 再デプロイ済みか（反映に数分ラグ）
