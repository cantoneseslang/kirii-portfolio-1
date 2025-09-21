# 認証情報セットアップガイド

## 概要
別のPCで認証書同期システムを実行するために必要な認証情報の設定手順です。

## 必要な認証情報

### 1. Google Cloud Console設定

#### 1-1. プロジェクト作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名: `certificate-sync-system`
4. プロジェクトID: `certificate-sync-system-xxxxx` (自動生成)

#### 1-2. Google Drive API有効化
1. 左側メニューから「APIとサービス」→「ライブラリ」を選択
2. 「Google Drive API」を検索
3. 「有効にする」をクリック

#### 1-3. サービスアカウント作成
1. 「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名: `certificate-sync-service`
4. 説明: `認証書同期システム用サービスアカウント`
5. 「作成して続行」をクリック

#### 1-4. サービスアカウントキー作成
1. 作成したサービスアカウントをクリック
2. 「キー」タブを選択
3. 「鍵を追加」→「新しい鍵を作成」を選択
4. キータイプ: `JSON`
5. 「作成」をクリック
6. ダウンロードされたJSONファイルを`credentials.json`として保存

### 2. Google Drive設定

#### 2-1. 対象フォルダの確認
- 既存の認証書フォルダID: `1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It`
- フォルダURL: `https://drive.google.com/drive/folders/1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It`

#### 2-2. サービスアカウントへの権限付与
1. Google Driveで対象フォルダを開く
2. フォルダを右クリック→「共有」を選択
3. サービスアカウントのメールアドレスを追加
4. 権限を「編集者」に設定

**サービスアカウントメールアドレス例:**
```
certificate-sync-service@certificate-sync-system-xxxxx.iam.gserviceaccount.com
```

### 3. 設定ファイル (config.js)

```javascript
// 認証書同期システム設定ファイル

module.exports = {
  // 監視フォルダ設定
  SOURCE_FOLDER: '\\\\server\\shared\\certificates\\', // 社内ネットワーク共有フォルダ
  
  // Google Drive設定
  TARGET_FOLDER_ID: '1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It', // 既存の認証書フォルダID
  GOOGLE_CREDENTIALS_PATH: './credentials.json', // サービスアカウントキーファイル
  
  // ファイル処理設定
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB制限
  POLL_INTERVAL: 300000, // 5分間隔での定期同期（ミリ秒）
  
  // ログ設定
  LOG_LEVEL: 'info', // debug, info, warn, error
  LOG_FILE: 'sync.log',
  
  // ファイル監視設定
  WATCH_OPTIONS: {
    ignored: /(^|[\/\\])\../, // 隠しファイルを無視
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000, // 2秒間の安定性を待つ
      pollInterval: 100
    }
  },
  
  // サポートするファイル形式
  ALLOWED_EXTENSIONS: [
    '.pdf',
    '.xlsx',
    '.xls',
    '.docx',
    '.doc',
    '.png',
    '.jpg',
    '.jpeg'
  ],
  
  // カテゴリ分類設定
  CATEGORY_RULES: {
    'Powder Coating': ['powder', '粉末'],
    'PVDF coating': ['pvdf'],
    'Company Cert': ['company', 'cert', '会社', 'org'],
    'Galvanized Steel Panel': ['galvanized', '亜鉛'],
    'Stainless Steel': ['stainless', 'ステンレス'],
    'Gypsum Board, M2Tech & Cement Board': ['gypsum', '石膏'],
    'Standards - pdf for reference': ['standard', '標準', 'bd', 'en'],
    'Mill Cert': ['mill', 'mill cert'],
    'Metal': ['metal'],
    'Ceiling System': ['ceiling'],
    'Cement Board': ['cement'],
    'Acoustic Material': ['acoustic', 'sound'],
    'Water Based Coating': ['water', '水性'],
    'Wooden Sticker': ['wooden', '木'],
    'Tai Shan 泰山': ['tai', '泰山'],
    'Sum-Powder Coating': ['sum'],
    'MK': ['mk'],
    'RED': ['red'],
    'Soundex': ['soundex'],
    'Tee Grid': ['teegrid', 'tee'],
    'Test Standard Info': ['test', 'テスト'],
    'New Element 新元素': ['new', '新'],
    'M6 Stud Bolt (M6 螺絲)': ['m6', '螺絲'],
    'Kirii HK': ['kirii'],
    '泰石Mineral Wool': ['泰石', 'mineral'],
    '阿克蘇': ['阿克蘇']
  },
  
  // 通知設定
  NOTIFICATIONS: {
    enabled: true,
    email: 'admin@yourcompany.com', // 管理者メールアドレス
    webhook: null // Slack等のWebhook URL（オプション）
  },
  
  // エラー処理設定
  ERROR_HANDLING: {
    maxRetries: 3,
    retryDelay: 5000, // 5秒
    skipOnError: false // エラー時にファイルをスキップするか
  },
  
  // パフォーマンス設定
  PERFORMANCE: {
    concurrentUploads: 3, // 同時アップロード数
    batchSize: 10, // バッチ処理サイズ
    memoryLimit: 100 * 1024 * 1024 // 100MB
  }
};
```

### 4. サービスアカウントキー (credentials.json)

```json
{
  "type": "service_account",
  "project_id": "certificate-sync-system-xxxxx",
  "private_key_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "certificate-sync-service@certificate-sync-system-xxxxx.iam.gserviceaccount.com",
  "client_id": "xxxxxxxxxxxxxxxxxxxxxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/certificate-sync-service%40certificate-sync-system-xxxxx.iam.gserviceaccount.com"
}
```

**注意:** 上記のJSONは例です。実際の値はGoogle Cloud Consoleからダウンロードしたファイルを使用してください。

### 5. 環境変数設定（オプション）

#### Windows (環境変数)
```cmd
set LOG_LEVEL=debug
set SOURCE_FOLDER=\\server\shared\certificates\
set TARGET_FOLDER_ID=1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It
set MAX_FILE_SIZE=10485760
```

#### Mac/Linux (環境変数)
```bash
export LOG_LEVEL=debug
export SOURCE_FOLDER="//server/shared/certificates/"
export TARGET_FOLDER_ID="1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It"
export MAX_FILE_SIZE=10485760
```

### 6. 社内ネットワーク設定

#### 6-1. 共有フォルダパス
```
Windows: \\server\shared\certificates\
Mac/Linux: //server/shared/certificates/
```

#### 6-2. アクセス権限
- 共有フォルダへの読み取り権限が必要
- ドメイン認証が必要な場合は適切にログイン
- ネットワーク接続の確認

### 7. ファイアウォール設定

#### 7-1. 必要なポート
- **HTTPS (443)**: Google Drive API通信
- **HTTP (80)**: 認証関連通信

#### 7-2. プロキシ設定（必要に応じて）
```javascript
// config.jsに追加
const auth = new google.auth.GoogleAuth({
  keyFile: config.GOOGLE_CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/drive'],
  httpOptions: {
    proxy: 'http://proxy.company.com:8080'
  }
});
```

### 8. セキュリティ考慮事項

#### 8-1. 認証情報の保護
- `credentials.json`は適切に保護
- バージョン管理システムに含めない
- 定期的にキーをローテーション

#### 8-2. アクセス制御
- サービスアカウントの権限を最小限に設定
- 必要に応じてIP制限を設定

### 9. トラブルシューティング

#### 9-1. 認証エラーの確認
```bash
# 認証情報の確認
node -e "console.log(require('./credentials.json').client_email)"
```

#### 9-2. ネットワーク接続の確認
```bash
# Google Drive APIへの接続確認
curl -I https://www.googleapis.com/drive/v3/files
```

#### 9-3. フォルダアクセスの確認
```bash
# 共有フォルダへのアクセス確認
# Windows
dir "\\server\shared\certificates\"

# Mac/Linux
ls "//server/shared/certificates/"
```

### 10. 初期設定手順

1. **Node.jsインストール**
   ```bash
   # バージョン確認
   node --version
   npm --version
   ```

2. **プロジェクトセットアップ**
   ```bash
   # 依存関係インストール
   npm install
   
   # 設定ファイル作成
   cp config.js.example config.js
   ```

3. **認証情報設定**
   ```bash
   # credentials.jsonを配置
   # Google Cloud Consoleからダウンロードしたファイルを配置
   ```

4. **設定ファイル編集**
   ```bash
   # config.jsを編集して設定値を入力
   nano config.js  # または notepad config.js
   ```

5. **動作確認**
   ```bash
   # テスト実行
   npm test
   
   # 本格実行
   npm start
   ```

### 11. 緊急時の連絡先

- **システム管理者**: admin@yourcompany.com
- **Google Cloud Console**: https://console.cloud.google.com/
- **Google Drive**: https://drive.google.com/

### 12. 更新履歴

- **v1.0.0 (2024-01-15)**: 初回リリース
- 認証情報の設定手順を詳細化
- セキュリティ考慮事項を追加
- トラブルシューティングガイドを充実

---

**重要:** このファイルには機密情報が含まれています。適切に管理し、不要になったら安全に削除してください。

