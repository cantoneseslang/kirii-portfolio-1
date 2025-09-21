@echo off
echo ========================================
echo 認証書同期システム インストールスクリプト
echo ========================================

REM Node.jsの確認
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo エラー: Node.jsがインストールされていません
    echo https://nodejs.org/ からNode.jsをインストールしてください
    pause
    exit /b 1
)

echo Node.js確認完了

REM 依存関係のインストール
echo 依存関係をインストール中...
call npm install

if %errorlevel% neq 0 (
    echo エラー: 依存関係のインストールに失敗しました
    pause
    exit /b 1
)

echo 依存関係インストール完了

REM 設定ファイルの確認
if not exist "config.js" (
    echo 設定ファイルが見つかりません
    echo config.js.exampleをconfig.jsにコピーして設定してください
    copy config.js.example config.js
)

if not exist "credentials.json" (
    echo 警告: credentials.jsonが見つかりません
    echo Google Cloud Consoleでサービスアカウントキーをダウンロードして
    echo credentials.jsonとして配置してください
)

REM ログディレクトリの作成
if not exist "logs" mkdir logs

echo ========================================
echo インストール完了
echo ========================================
echo.
echo 次の手順:
echo 1. config.jsを編集して設定を確認
echo 2. credentials.jsonを配置
echo 3. start.batを実行してシステムを開始
echo.
pause

