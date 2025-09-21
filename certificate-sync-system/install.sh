#!/bin/bash

echo "========================================"
echo "認証書同期システム インストールスクリプト"
echo "========================================"

# Node.jsの確認
if ! command -v node &> /dev/null; then
    echo "エラー: Node.jsがインストールされていません"
    echo "https://nodejs.org/ からNode.jsをインストールしてください"
    exit 1
fi

echo "Node.js確認完了: $(node --version)"

# npmの確認
if ! command -v npm &> /dev/null; then
    echo "エラー: npmがインストールされていません"
    exit 1
fi

# 依存関係のインストール
echo "依存関係をインストール中..."
npm install

if [ $? -ne 0 ]; then
    echo "エラー: 依存関係のインストールに失敗しました"
    exit 1
fi

echo "依存関係インストール完了"

# 設定ファイルの確認
if [ ! -f "config.js" ]; then
    echo "設定ファイルが見つかりません"
    echo "config.js.exampleをconfig.jsにコピーして設定してください"
    if [ -f "config.js.example" ]; then
        cp config.js.example config.js
    fi
fi

if [ ! -f "credentials.json" ]; then
    echo "警告: credentials.jsonが見つかりません"
    echo "Google Cloud Consoleでサービスアカウントキーをダウンロードして"
    echo "credentials.jsonとして配置してください"
fi

# ログディレクトリの作成
mkdir -p logs

# 実行権限の付与
chmod +x start.sh

echo "========================================"
echo "インストール完了"
echo "========================================"
echo ""
echo "次の手順:"
echo "1. config.jsを編集して設定を確認"
echo "2. credentials.jsonを配置"
echo "3. ./start.shを実行してシステムを開始"
echo ""

