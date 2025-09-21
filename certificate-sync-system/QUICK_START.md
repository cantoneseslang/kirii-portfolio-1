# クイックスタートガイド

## 5分で始める認証書同期システム

### Step 1: 環境準備 (2分)

#### Node.jsのインストール
```bash
# Windows: https://nodejs.org/ からダウンロード
# Mac: brew install node
# Linux: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs

# バージョン確認
node --version  # v16.0.0以上が必要
npm --version
```

### Step 2: 認証情報の取得 (2分)

#### Google Cloud Console設定
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成: `certificate-sync-system`
3. Google Drive APIを有効化
4. サービスアカウントを作成: `certificate-sync-service`
5. JSONキーをダウンロード → `credentials.json`として保存

#### Google Drive設定
1. 対象フォルダを開く: `https://drive.google.com/drive/folders/1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It`
2. フォルダを右クリック → 「共有」
3. サービスアカウントのメールアドレスを追加（編集者権限）

### Step 3: システム起動 (1分)

#### Windows
```cmd
# プロジェクトフォルダに移動
cd certificate-sync-system

# インストール
install.bat

# 設定ファイル編集（共有フォルダパスを設定）
notepad config.js

# システム起動
start.bat
```

#### Mac/Linux
```bash
# プロジェクトフォルダに移動
cd certificate-sync-system

# インストール
chmod +x install.sh
./install.sh

# 設定ファイル編集（共有フォルダパスを設定）
nano config.js

# システム起動
./start.sh
```

### Step 4: 動作確認

#### ログ確認
```bash
# Windows
type sync.log

# Mac/Linux
tail -f sync.log
```

#### 期待されるログ
```
[2024-01-15 09:30:15] INFO: Google Drive API認証成功
[2024-01-15 09:30:15] INFO: 監視フォルダ: \\server\shared\certificates\
[2024-01-15 09:30:15] INFO: システム開始完了
```

#### テストファイル配置
1. 共有フォルダにPDFファイルを配置
2. ログでファイル処理を確認
3. Google Driveでファイルが正しくアップロードされることを確認

## 設定ファイルの最小構成

### config.js (最小設定)
```javascript
module.exports = {
  // 必須設定
  SOURCE_FOLDER: '\\\\server\\shared\\certificates\\',  // 共有フォルダパス
  TARGET_FOLDER_ID: '1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It',  // Google DriveフォルダID
  GOOGLE_CREDENTIALS_PATH: './credentials.json',  // 認証ファイル
  
  // オプション設定
  MAX_FILE_SIZE: 10 * 1024 * 1024,  // 10MB制限
  LOG_LEVEL: 'info'  // ログレベル
};
```

### credentials.json (例)
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com"
}
```

## よくある問題と解決方法

### 1. 認証エラー
```
ERROR: Google Drive API認証失敗
```
**解決方法:**
- `credentials.json`の配置を確認
- サービスアカウントの権限を確認

### 2. ネットワークエラー
```
ERROR: 監視フォルダが存在しません
```
**解決方法:**
- 共有フォルダのパスを確認
- ネットワーク接続を確認

### 3. ファイルアップロードエラー
```
ERROR: ファイルアップロード失敗
```
**解決方法:**
- ファイルサイズを確認（10MB以下）
- Google Driveの容量を確認

## 自動起動設定

### Windows (タスクスケジューラ)
1. タスクスケジューラを開く
2. 「基本タスクの作成」
3. トリガー: 「コンピューターの起動時」
4. 操作: 「プログラムの開始」
5. プログラム: `C:\path\to\certificate-sync-system\start.bat`

### Mac (launchd)
```bash
# ~/Library/LaunchAgents/com.certificate.sync.plist を作成
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.certificate.sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/certificate-sync-system/local_sync.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### Linux (systemd)
```bash
# /etc/systemd/system/certificate-sync.service を作成
[Unit]
Description=Certificate Sync System
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/certificate-sync-system
ExecStart=/usr/bin/node local_sync.js
Restart=always

[Install]
WantedBy=multi-user.target

# 有効化
sudo systemctl enable certificate-sync.service
sudo systemctl start certificate-sync.service
```

## サポート

問題が解決しない場合は、以下の情報を含めてサポートに連絡してください：

1. エラーメッセージ
2. ログファイル（最新の50行）
3. 設定ファイル（機密情報を除く）
4. システム環境（OS、Node.jsバージョン等）

**連絡先:** admin@yourcompany.com

