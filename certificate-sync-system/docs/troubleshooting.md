# トラブルシューティングガイド

## よくある問題と解決方法

### 1. 認証関連エラー

#### エラー: Google Drive API認証失敗
```
[2024-01-15 09:30:15] ERROR: Google Drive API認証失敗: invalid_grant
```

**原因:**
- サービスアカウントキーファイルが正しく配置されていない
- サービスアカウントの権限が不足している
- Google Drive APIが有効になっていない

**解決方法:**
1. `credentials.json`の配置を確認
```bash
ls -la credentials.json
```

2. サービスアカウントの権限を確認
   - Google Driveで対象フォルダの共有設定を確認
   - サービスアカウントのメールアドレスが「編集者」権限で追加されているか確認

3. Google Cloud ConsoleでAPIの有効化を確認
   - Google Drive API v3が有効になっているか確認

#### エラー: 権限が不足しています
```
[2024-01-15 09:30:15] ERROR: ファイル作成エラー: insufficientFilePermissions
```

**解決方法:**
1. 対象フォルダの共有設定を確認
2. サービスアカウントに適切な権限を付与
3. フォルダIDが正しいか確認

### 2. ネットワーク関連エラー

#### エラー: 監視フォルダが存在しません
```
[2024-01-15 09:30:15] ERROR: 監視フォルダが存在しません: \\server\shared\certificates\
```

**原因:**
- 共有フォルダのパスが間違っている
- ネットワーク接続に問題がある
- アクセス権限が不足している

**解決方法:**
1. 共有フォルダのパスを確認
```cmd
# Windows
dir "\\server\shared\certificates\"

# Mac/Linux
ls "//server/shared/certificates/"
```

2. ネットワーク接続を確認
```cmd
# Windows
ping server

# Mac/Linux
ping server
```

3. アクセス権限を確認
   - 共有フォルダへの読み取り権限があるか確認
   - ドメイン認証が必要な場合は適切にログイン

#### エラー: ネットワーク接続エラー
```
[2024-01-15 09:30:15] ERROR: ファイルアップロード失敗: network error
```

**解決方法:**
1. インターネット接続を確認
2. プロキシ設定を確認
3. ファイアウォール設定を確認

### 3. ファイル処理関連エラー

#### エラー: ファイルサイズが大きすぎます
```
[2024-01-15 09:30:15] WARN: ファイルサイズが大きすぎます: large_file.pdf (15.2MB)
```

**原因:**
- ファイルサイズが設定値（10MB）を超えている

**解決方法:**
1. ファイルサイズを確認
2. 必要に応じて`config.js`で`MAX_FILE_SIZE`を調整
```javascript
MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MBに変更
```

#### エラー: サポートされていないファイル形式
```
[2024-01-15 09:30:15] WARN: サポートされていないファイル形式: image.tiff
```

**原因:**
- ファイル拡張子がサポート対象外

**解決方法:**
1. ファイル形式を確認
2. 必要に応じて`config.js`で`ALLOWED_EXTENSIONS`に追加
```javascript
ALLOWED_EXTENSIONS: [
  '.pdf',
  '.xlsx',
  '.xls',
  '.docx',
  '.doc',
  '.png',
  '.jpg',
  '.jpeg',
  '.tiff' // 追加
]
```

#### エラー: ファイルが使用中です
```
[2024-01-15 09:30:15] ERROR: ファイル処理エラー: EBUSY: resource busy or locked
```

**原因:**
- ファイルが他のアプリケーションで開かれている
- ファイルがロックされている

**解決方法:**
1. ファイルを開いているアプリケーションを閉じる
2. ファイルのロックを解除
3. システムを再起動

### 4. Google Drive API関連エラー

#### エラー: クォータを超えました
```
[2024-01-15 09:30:15] ERROR: ファイルアップロード失敗: quotaExceeded
```

**原因:**
- Google Drive APIの使用制限に達した
- Google Driveの容量制限に達した

**解決方法:**
1. API使用量を確認
2. Google Driveの容量を確認
3. 不要なファイルを削除
4. 処理間隔を調整

#### エラー: ファイルが見つかりません
```
[2024-01-15 09:30:15] ERROR: 既存ファイル検索エラー: fileNotFound
```

**原因:**
- ファイルIDが無効
- ファイルが削除されている

**解決方法:**
1. ファイルIDを確認
2. フォルダ構造を確認
3. システムを再起動

### 5. システム関連エラー

#### エラー: メモリ不足
```
[2024-01-15 09:30:15] ERROR: システム起動エラー: JavaScript heap out of memory
```

**原因:**
- メモリ使用量が上限を超えた
- 大量のファイルを同時処理している

**解決方法:**
1. システムを再起動
2. `config.js`で`PERFORMANCE`設定を調整
```javascript
PERFORMANCE: {
  concurrentUploads: 1, // 同時アップロード数を減らす
  batchSize: 5, // バッチサイズを減らす
  memoryLimit: 50 * 1024 * 1024 // メモリ制限を下げる
}
```

#### エラー: プロセスが応答しません
```
[2024-01-15 09:30:15] ERROR: 未処理の例外: timeout
```

**原因:**
- 処理が長時間実行されている
- ネットワークが遅い

**解決方法:**
1. システムを再起動
2. ネットワーク接続を確認
3. 処理間隔を調整

## ログ分析

### ログレベルの設定

デバッグ時は`config.js`でログレベルを変更：

```javascript
LOG_LEVEL: 'debug', // debug, info, warn, error
```

### ログの確認方法

#### Windows
```cmd
# リアルタイムログ確認
type sync.log

# 最新のログのみ表示
powershell "Get-Content sync.log -Tail 50"
```

#### Mac/Linux
```bash
# リアルタイムログ確認
tail -f sync.log

# 最新のログのみ表示
tail -n 50 sync.log

# エラーログのみ表示
grep "ERROR" sync.log
```

### ログの分析ポイント

1. **認証エラー**
   - `Google Drive API認証失敗`
   - `権限が不足しています`

2. **ネットワークエラー**
   - `監視フォルダが存在しません`
   - `ネットワーク接続エラー`

3. **ファイル処理エラー**
   - `ファイルサイズが大きすぎます`
   - `サポートされていないファイル形式`

4. **APIエラー**
   - `クォータを超えました`
   - `ファイルが見つかりません`

## パフォーマンス最適化

### 1. 同時処理数の調整

```javascript
PERFORMANCE: {
  concurrentUploads: 2, // 同時アップロード数を減らす
  batchSize: 5, // バッチサイズを調整
  memoryLimit: 100 * 1024 * 1024 // メモリ制限を設定
}
```

### 2. ファイル監視の最適化

```javascript
WATCH_OPTIONS: {
  ignored: /(^|[\/\\])\../, // 隠しファイルを無視
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 5000, // 安定性チェック時間を延長
    pollInterval: 200
  }
}
```

### 3. 定期同期の調整

```javascript
POLL_INTERVAL: 600000, // 10分間隔に変更（デフォルト5分）
```

## 緊急時の対応

### 1. システム停止

```bash
# プロセスを強制終了
# Windows
taskkill /f /im node.exe

# Mac/Linux
pkill -f local_sync.js
```

### 2. ログのバックアップ

```bash
# ログファイルをバックアップ
cp sync.log sync.log.backup.$(date +%Y%m%d_%H%M%S)
```

### 3. 設定のリセット

```bash
# 設定ファイルをバックアップ
cp config.js config.js.backup

# デフォルト設定に戻す
cp config.js.example config.js
```

## 予防策

### 1. 定期的なメンテナンス

- ログファイルのローテーション
- 一時ファイルのクリーンアップ
- システムの再起動

### 2. 監視の設定

- ログファイルの監視
- ディスク使用量の監視
- ネットワーク接続の監視

### 3. バックアップの作成

- 設定ファイルのバックアップ
- ログファイルのバックアップ
- システムのバックアップ

## サポート

問題が解決しない場合は、以下の情報を含めてサポートに連絡してください：

1. エラーメッセージ
2. ログファイル（最新の50行）
3. 設定ファイル（機密情報を除く）
4. システム環境（OS、Node.jsバージョン等）
5. 発生時刻と頻度

