@echo off
echo ========================================
echo 認証書同期システム 起動スクリプト
echo ========================================

REM 設定ファイルの確認
if not exist "config.js" (
    echo エラー: config.jsが見つかりません
    echo install.batを実行してインストールしてください
    pause
    exit /b 1
)

if not exist "credentials.json" (
    echo エラー: credentials.jsonが見つかりません
    echo Google Cloud Consoleでサービスアカウントキーをダウンロードしてください
    pause
    exit /b 1
)

REM ログファイルの確認
if not exist "sync.log" (
    echo ログファイルを作成中...
    echo. > sync.log
)

echo システムを起動中...
echo 終了するには Ctrl+C を押してください
echo.

REM システム起動
node local_sync.js

echo.
echo システムが終了しました
pause

