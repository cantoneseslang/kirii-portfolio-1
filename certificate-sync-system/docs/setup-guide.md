# セットアップガイド

## 前提条件

### 必要なソフトウェア
- Node.js 16.0.0以上
- npm（Node.jsに含まれています）
- Google Cloud Consoleアカウント

### 必要な権限
- 社内ネットワーク共有フォルダへの読み取り権限
- Google Drive APIの使用権限
- Google Cloud Consoleでのプロジェクト作成権限

## セットアップ手順

### Step 1: Node.jsのインストール

#### Windows
1. [Node.js公式サイト](https://nodejs.org/)にアクセス
2. LTS版をダウンロード
3. インストーラーを実行
4. コマンドプロンプトで確認
```cmd
node --version
npm --version
```

#### Mac
```bash
# Homebrewを使用
brew install node

# または公式サイトからダウンロード
```

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs
```

### Step 2: Google Cloud Console設定

#### 2-1. プロジェクト作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名を設定（例：certificate-sync-system）

#### 2-2. Google Drive API有効化
1. 左側メニューから「APIとサービス」→「ライブラリ」を選択
2. 「Google Drive API」を検索
3. 「有効にする」をクリック

#### 2-3. サービスアカウント作成
1. 「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名を入力（例：certificate-sync-service）
4. 説明を入力（例：認証書同期システム用サービスアカウント）
5. 「作成して続行」をクリック

#### 2-4. サービスアカウントキー作成
1. 作成したサービスアカウントをクリック
2. 「キー」タブを選択
3. 「鍵を追加」→「新しい鍵を作成」を選択
4. キータイプは「JSON」を選択
5. 「作成」をクリック
6. ダウンロードされたJSONファイルを`credentials.json`として保存

### Step 3: Google Drive設定

#### 3-1. 対象フォルダの確認
1. Google Driveにアクセス
2. 既存の認証書フォルダIDを確認
3. フォルダの共有設定を確認

#### 3-2. サービスアカウントへの権限付与
1. 対象フォルダを右クリック
2. 「共有」を選択
3. サービスアカウントのメールアドレスを追加
4. 権限を「編集者」に設定

### Step 4: システムインストール

#### Windows
```cmd
# プロジェクトフォルダに移動
cd certificate-sync-system

# インストール実行
install.bat

# 設定ファイル編集
notepad config.js

# システム起動
start.bat
```

#### Mac/Linux
```bash
# プロジェクトフォルダに移動
cd certificate-sync-system

# インストール実行
chmod +x install.sh
./install.sh

# 設定ファイル編集
nano config.js

# システム起動
./start.sh
```

### Step 5: 設定ファイル編集

`config.js`を編集して以下の設定を確認：

```javascript
module.exports = {
  // 監視フォルダ（社内ネットワーク共有フォルダ）
  SOURCE_FOLDER: '\\\\server\\shared\\certificates\\',
  
  // Google Drive対象フォルダID
  TARGET_FOLDER_ID: '1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It',
  
  // サービスアカウントキーファイル
  GOOGLE_CREDENTIALS_PATH: './credentials.json',
  
  // その他の設定...
};
```

### Step 6: 動作確認

#### 6-1. 初回テスト
1. システムを起動
2. ログを確認
3. テストファイルを共有フォルダに配置
4. Google Driveでファイルが正しくアップロードされることを確認

#### 6-2. ログ確認
```bash
# Windows
type sync.log

# Mac/Linux
tail -f sync.log
```

## トラブルシューティング

### よくある問題

#### 1. 認証エラー
```
エラー: Google Drive API認証失敗
```
**解決方法:**
- `credentials.json`の配置を確認
- サービスアカウントの権限を確認
- Google Drive APIが有効になっているか確認

#### 2. ネットワークエラー
```
エラー: 監視フォルダが存在しません
```
**解決方法:**
- 共有フォルダのパスを確認
- ネットワーク接続を確認
- アクセス権限を確認

#### 3. ファイルアップロードエラー
```
エラー: ファイルアップロード失敗
```
**解決方法:**
- ファイルサイズを確認（10MB以下）
- ファイル形式を確認（PDF, Excel, Word等）
- Google Driveの容量を確認

### ログレベル設定

デバッグ時は`config.js`でログレベルを変更：

```javascript
LOG_LEVEL: 'debug', // debug, info, warn, error
```

## 自動起動設定

### Windows（タスクスケジューラ）

1. タスクスケジューラを開く
2. 「基本タスクの作成」を選択
3. タスク名を入力（例：認証書同期システム）
4. トリガーを「コンピューターの起動時」に設定
5. 操作を「プログラムの開始」に設定
6. プログラム：`C:\path\to\certificate-sync-system\start.bat`

### Mac（launchd）

1. `~/Library/LaunchAgents/`にplistファイルを作成
2. システム起動時に自動実行されるように設定

### Linux（systemd）

1. `/etc/systemd/system/`にserviceファイルを作成
2. `systemctl enable`で自動起動を有効化

## セキュリティ考慮事項

### 1. 認証情報の管理
- `credentials.json`は適切に保護
- バージョン管理システムに含めない
- 定期的にキーをローテーション

### 2. ネットワークセキュリティ
- 社内ネットワークのアクセス制御
- ファイアウォール設定の確認

### 3. ログ管理
- ログファイルの適切な管理
- 機密情報のログ出力回避

## メンテナンス

### 定期メンテナンス
- ログファイルのローテーション
- 一時ファイルのクリーンアップ
- サービスアカウントキーの更新

### 監視項目
- システムの稼働状況
- エラー発生頻度
- ファイル処理数
- ディスク使用量

