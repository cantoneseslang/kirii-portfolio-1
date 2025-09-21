#!/bin/bash

echo "========================================"
echo "認証書同期システム 起動スクリプト"
echo "========================================"

# 設定ファイルの確認
if [ ! -f "config.js" ]; then
    echo "エラー: config.jsが見つかりません"
    echo "install.shを実行してインストールしてください"
    exit 1
fi

if [ ! -f "credentials.json" ]; then
    echo "エラー: credentials.jsonが見つかりません"
    echo "Google Cloud Consoleでサービスアカウントキーをダウンロードしてください"
    exit 1
fi

# ログファイルの確認
if [ ! -f "sync.log" ]; then
    echo "ログファイルを作成中..."
    touch sync.log
fi

echo "システムを起動中..."
echo "終了するには Ctrl+C を押してください"
echo ""

# システム起動
node local_sync.js

echo ""
echo "システムが終了しました"

