# 認証書自動同期システム

## 概要
社内ネットワークの共有フォルダからGoogle Driveへの認証書ファイル自動同期システム

## 要件定義

### 機能要件
- 社内ネットワークの共有フォルダ（\\server\shared\certificates\）を監視
- ファイル変更を検知したら自動的にGoogle Driveにアップロード
- ファイル名に基づいて自動的にカテゴリ分類
- 既存のProduct Certificateシステムと連携

### 非機能要件
- リアルタイム監視（ファイル変更の即座な検知）
- ファイルサイズ制限（10MB以下）
- エラーハンドリングとログ出力
- 既存システムへの影響なし

### 制約事項
- 社内ネットワークの共有フォルダはGoogle Drive for desktopで直接同期不可
- Google Drive APIの使用制限に準拠
- ローカルPC上での実行が必要

## システム構成

```
社内ネットワーク共有フォルダ
    ↓ (ファイル監視)
ローカルPC (Node.jsスクリプト)
    ↓ (Google Drive API)
Google Drive
    ↓ (既存システム)
Product Certificateページ
```

## 技術スタック
- Node.js
- Google Drive API v3
- Google Cloud Service Account
- ファイルシステム監視

## ファイル構成
```
certificate-sync-system/
├── README.md                    # このファイル
├── package.json                 # Node.js依存関係
├── local_sync.js               # メイン同期スクリプト
├── config.js                   # 設定ファイル
├── install.bat                 # Windows用インストールスクリプト
├── start.bat                   # Windows用起動スクリプト
├── install.sh                  # Mac/Linux用インストールスクリプト
├── start.sh                    # Mac/Linux用起動スクリプト
├── credentials.json.example    # サービスアカウントキーの例
└── docs/                       # 詳細ドキュメント
    ├── setup-guide.md          # セットアップガイド
    ├── troubleshooting.md      # トラブルシューティング
    └── api-reference.md        # APIリファレンス
```

## セットアップ手順

### 1. 環境準備
```bash
# Node.jsをインストール（https://nodejs.org/）
# バージョン16以上を推奨
```

### 2. プロジェクトセットアップ
```bash
# プロジェクトフォルダに移動
cd certificate-sync-system

# 依存関係をインストール
npm install

# 設定ファイルをコピー
cp config.js.example config.js
```

### 3. Google Cloud設定
1. Google Cloud Consoleでプロジェクトを作成
2. Google Drive APIを有効化
3. サービスアカウントを作成
4. サービスアカウントキーをダウンロード
5. `credentials.json`として配置

### 4. 設定
`config.js`を編集して設定値を入力

### 5. 実行
```bash
# Windows
start.bat

# Mac/Linux
./start.sh
```

## カテゴリ分類ルール

| キーワード | カテゴリ |
|-----------|---------|
| powder, 粉末 | Powder Coating |
| pvdf | PVDF coating |
| company, cert, 会社, org | Company Cert |
| galvanized, 亜鉛 | Galvanized Steel Panel |
| stainless, ステンレス | Stainless Steel |
| gypsum, 石膏 | Gypsum Board, M2Tech & Cement Board |
| standard, 標準, bd, en | Standards - pdf for reference |
| mill, mill cert | Mill Cert |
| metal | Metal |
| ceiling | Ceiling System |
| cement | Cement Board |
| acoustic, sound | Acoustic Material |
| その他 | Root Files |

## ログ出力

### 正常ログ
```
[2024-01-15 09:30:15] フォルダ監視開始: \\server\shared\certificates\
[2024-01-15 09:30:20] ファイル変更検知: certificate.pdf
[2024-01-15 09:30:21] ファイル分類: certificate.pdf → Company Cert
[2024-01-15 09:30:22] アップロード完了: certificate.pdf → Company Cert
```

### エラーログ
```
[2024-01-15 09:30:15] エラー: ファイルサイズが大きすぎます: large_file.pdf
[2024-01-15 09:30:20] エラー: アップロード失敗: network_error.pdf
```

## トラブルシューティング

### よくある問題
1. **認証エラー**: credentials.jsonの設定を確認
2. **ネットワークエラー**: 社内ネットワークへの接続を確認
3. **ファイルサイズエラー**: 10MB以下のファイルのみ処理
4. **権限エラー**: Google Driveの共有設定を確認

### ログ確認
```bash
# ログファイルの確認
tail -f sync.log
```

## メンテナンス

### 定期メンテナンス
- ログファイルのローテーション
- 一時ファイルのクリーンアップ
- サービスアカウントキーの更新

### 監視項目
- 同期処理の実行状況
- エラー発生頻度
- ファイル処理数
- ディスク使用量

## ライセンス
このプロジェクトは社内使用目的で作成されています。

## 更新履歴
- v1.0.0 (2024-01-15): 初回リリース

