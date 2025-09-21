# APIリファレンス

## 概要

認証書同期システムのAPIリファレンスです。システムの内部構造と設定オプションについて説明します。

## メインクラス: CertificateSyncSystem

### コンストラクタ
```javascript
const syncSystem = new CertificateSyncSystem();
```

### メソッド

#### start()
システムを開始します。

```javascript
await syncSystem.start();
```

**戻り値:** `Promise<void>`

**説明:**
- Google Drive API認証を実行
- 初回同期を実行
- ファイル監視を開始
- 定期同期を開始

#### getStats()
統計情報を取得します。

```javascript
const stats = syncSystem.getStats();
console.log(stats);
```

**戻り値:** `Object`
```javascript
{
  isRunning: boolean,        // システムの実行状態
  processedFiles: number,    // 処理済みファイル数
  processedFileList: Array   // 処理済みファイル名の配列
}
```

## 設定ファイル (config.js)

### 基本設定

#### SOURCE_FOLDER
監視対象の共有フォルダパス

```javascript
SOURCE_FOLDER: '\\\\server\\shared\\certificates\\'
```

**型:** `string`
**必須:** はい
**説明:** 社内ネットワークの共有フォルダパス

#### TARGET_FOLDER_ID
Google Driveの対象フォルダID

```javascript
TARGET_FOLDER_ID: '1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It'
```

**型:** `string`
**必須:** はい
**説明:** 既存の認証書フォルダのGoogle Drive ID

#### GOOGLE_CREDENTIALS_PATH
サービスアカウントキーファイルのパス

```javascript
GOOGLE_CREDENTIALS_PATH: './credentials.json'
```

**型:** `string`
**必須:** はい
**説明:** Google Cloud Consoleからダウンロードしたサービスアカウントキーファイル

### ファイル処理設定

#### MAX_FILE_SIZE
最大ファイルサイズ（バイト）

```javascript
MAX_FILE_SIZE: 10 * 1024 * 1024  // 10MB
```

**型:** `number`
**デフォルト:** `10485760` (10MB)
**説明:** 処理対象ファイルの最大サイズ

#### POLL_INTERVAL
定期同期の間隔（ミリ秒）

```javascript
POLL_INTERVAL: 300000  // 5分
```

**型:** `number`
**デフォルト:** `300000` (5分)
**説明:** バックアップ用の定期同期実行間隔

### ログ設定

#### LOG_LEVEL
ログレベル

```javascript
LOG_LEVEL: 'info'  // debug, info, warn, error
```

**型:** `string`
**デフォルト:** `'info'`
**有効値:** `'debug'`, `'info'`, `'warn'`, `'error'`

#### LOG_FILE
ログファイル名

```javascript
LOG_FILE: 'sync.log'
```

**型:** `string`
**デフォルト:** `'sync.log'`

### ファイル監視設定

#### WATCH_OPTIONS
ファイル監視のオプション

```javascript
WATCH_OPTIONS: {
  ignored: /(^|[\/\\])\../,  // 隠しファイルを無視
  persistent: true,          // 永続監視
  ignoreInitial: true,       // 初回スキャンを無視
  awaitWriteFinish: {
    stabilityThreshold: 2000,  // 2秒間の安定性を待つ
    pollInterval: 100          // 100ms間隔でチェック
  }
}
```

**型:** `Object`
**説明:** chokidarライブラリの監視オプション

### サポートファイル形式

#### ALLOWED_EXTENSIONS
処理対象のファイル拡張子

```javascript
ALLOWED_EXTENSIONS: [
  '.pdf',
  '.xlsx',
  '.xls',
  '.docx',
  '.doc',
  '.png',
  '.jpg',
  '.jpeg'
]
```

**型:** `Array<string>`
**説明:** 処理対象とするファイル拡張子のリスト

### カテゴリ分類設定

#### CATEGORY_RULES
ファイル名からカテゴリを判定するルール

```javascript
CATEGORY_RULES: {
  'Powder Coating': ['powder', '粉末'],
  'PVDF coating': ['pvdf'],
  'Company Cert': ['company', 'cert', '会社', 'org'],
  // ... その他のカテゴリ
}
```

**型:** `Object<string, Array<string>>`
**説明:** カテゴリ名とキーワードのマッピング

### 通知設定

#### NOTIFICATIONS
通知機能の設定

```javascript
NOTIFICATIONS: {
  enabled: true,                    // 通知を有効にするか
  email: 'admin@yourcompany.com',   // 管理者メールアドレス
  webhook: null                     // Slack等のWebhook URL
}
```

**型:** `Object`
**説明:** エラー通知や完了通知の設定

### エラー処理設定

#### ERROR_HANDLING
エラー処理の設定

```javascript
ERROR_HANDLING: {
  maxRetries: 3,        // 最大リトライ回数
  retryDelay: 5000,     // リトライ間隔（ミリ秒）
  skipOnError: false    // エラー時にファイルをスキップするか
}
```

**型:** `Object`
**説明:** エラー発生時の処理方法

### パフォーマンス設定

#### PERFORMANCE
パフォーマンス関連の設定

```javascript
PERFORMANCE: {
  concurrentUploads: 3,              // 同時アップロード数
  batchSize: 10,                     // バッチ処理サイズ
  memoryLimit: 100 * 1024 * 1024    // メモリ制限（バイト）
}
```

**型:** `Object`
**説明:** システムのパフォーマンス調整

## ログ形式

### ログエントリの構造

```
[YYYY-MM-DD HH:mm:ss] LEVEL: message
```

**例:**
```
[2024-01-15 09:30:15] INFO: ファイル変更検知: certificate.pdf
[2024-01-15 09:30:16] INFO: ファイル分類: certificate.pdf → Company Cert
[2024-01-15 09:30:17] INFO: ファイルアップロード完了: certificate.pdf → Company Cert
```

### ログレベル

#### DEBUG
詳細なデバッグ情報

```
[2024-01-15 09:30:15] DEBUG: ファイル監視開始: \\server\shared\certificates\
[2024-01-15 09:30:15] DEBUG: 監視オプション: {ignored: /(^|[\/\\])\../, persistent: true}
```

#### INFO
一般的な情報

```
[2024-01-15 09:30:15] INFO: システム開始完了
[2024-01-15 09:30:15] INFO: ファイル変更検知: certificate.pdf
```

#### WARN
警告情報

```
[2024-01-15 09:30:15] WARN: ファイルサイズが大きすぎます: large_file.pdf (15.2MB)
[2024-01-15 09:30:15] WARN: サポートされていないファイル形式: image.tiff
```

#### ERROR
エラー情報

```
[2024-01-15 09:30:15] ERROR: Google Drive API認証失敗: invalid_grant
[2024-01-15 09:30:15] ERROR: ファイル処理エラー: EBUSY: resource busy or locked
```

## カテゴリ分類ルール

### デフォルトカテゴリ

| カテゴリ名 | キーワード |
|-----------|-----------|
| Powder Coating | powder, 粉末 |
| PVDF coating | pvdf |
| Company Cert | company, cert, 会社, org |
| Galvanized Steel Panel | galvanized, 亜鉛 |
| Stainless Steel | stainless, ステンレス |
| Gypsum Board, M2Tech & Cement Board | gypsum, 石膏 |
| Standards - pdf for reference | standard, 標準, bd, en |
| Mill Cert | mill, mill cert |
| Metal | metal |
| Ceiling System | ceiling |
| Cement Board | cement |
| Acoustic Material | acoustic, sound |
| Water Based Coating | water, 水性 |
| Wooden Sticker | wooden, 木 |
| Tai Shan 泰山 | tai, 泰山 |
| Sum-Powder Coating | sum |
| MK | mk |
| RED | red |
| Soundex | soundex |
| Tee Grid | teegrid, tee |
| Test Standard Info | test, テスト |
| New Element 新元素 | new, 新 |
| M6 Stud Bolt (M6 螺絲) | m6, 螺絲 |
| Kirii HK | kirii |
| 泰石Mineral Wool | 泰石, mineral |
| 阿克蘇 | 阿克蘇 |
| Root Files | その他（デフォルト） |

### カスタムカテゴリの追加

`config.js`の`CATEGORY_RULES`に新しいカテゴリを追加：

```javascript
CATEGORY_RULES: {
  // 既存のカテゴリ...
  'Custom Category': ['custom', 'カスタム', 'special'],
  'New Material': ['newmaterial', '新素材']
}
```

## エラーコード

### 認証エラー

| エラーコード | 説明 | 解決方法 |
|------------|------|---------|
| `invalid_grant` | 認証情報が無効 | credentials.jsonを確認 |
| `insufficientFilePermissions` | 権限不足 | フォルダの共有設定を確認 |
| `quotaExceeded` | API使用制限超過 | 使用量を確認 |

### ネットワークエラー

| エラーコード | 説明 | 解決方法 |
|------------|------|---------|
| `ENOENT` | ファイル/フォルダが存在しない | パスを確認 |
| `ENOTFOUND` | ホストが見つからない | ネットワーク接続を確認 |
| `ECONNREFUSED` | 接続が拒否された | ファイアウォール設定を確認 |

### ファイル処理エラー

| エラーコード | 説明 | 解決方法 |
|------------|------|---------|
| `EBUSY` | ファイルが使用中 | ファイルを閉じる |
| `EMFILE` | ファイル記述子が不足 | システムを再起動 |
| `ENOSPC` | ディスク容量不足 | 容量を確保 |

## 環境変数

### 設定可能な環境変数

```bash
# ログレベル
export LOG_LEVEL=debug

# 監視フォルダ
export SOURCE_FOLDER="\\\\server\\shared\\certificates\\"

# 対象フォルダID
export TARGET_FOLDER_ID="1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It"

# 最大ファイルサイズ（MB）
export MAX_FILE_SIZE=20
```

### 環境変数の優先順位

1. 環境変数
2. config.js
3. デフォルト値

## 拡張機能

### カスタムファイル処理

```javascript
// カスタムファイル処理関数を追加
class CustomCertificateSyncSystem extends CertificateSyncSystem {
  async processFile(filePath) {
    // カスタム処理を実装
    const result = await super.processFile(filePath);
    
    // 追加処理
    await this.customProcessing(filePath, result);
    
    return result;
  }
  
  async customProcessing(filePath, result) {
    // カスタムロジック
  }
}
```

### カスタム通知

```javascript
// カスタム通知機能を追加
class NotificationService {
  async sendSlackNotification(message) {
    // Slack通知の実装
  }
  
  async sendEmailNotification(message) {
    // メール通知の実装
  }
}
```

## パフォーマンスチューニング

### メモリ使用量の最適化

```javascript
PERFORMANCE: {
  concurrentUploads: 2,              // 同時アップロード数を減らす
  batchSize: 5,                      // バッチサイズを小さくする
  memoryLimit: 50 * 1024 * 1024     // メモリ制限を下げる
}
```

### ネットワーク最適化

```javascript
// プロキシ設定
const auth = new google.auth.GoogleAuth({
  keyFile: config.GOOGLE_CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/drive'],
  // プロキシ設定
  httpOptions: {
    proxy: 'http://proxy.company.com:8080'
  }
});
```

### ファイル監視の最適化

```javascript
WATCH_OPTIONS: {
  ignored: [
    /(^|[\/\\])\../,           // 隠しファイル
    /\.tmp$/,                  // 一時ファイル
    /\.log$/,                  // ログファイル
    /node_modules/             // node_modules
  ],
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 5000,  // 安定性チェック時間を延長
    pollInterval: 200
  }
}
```

