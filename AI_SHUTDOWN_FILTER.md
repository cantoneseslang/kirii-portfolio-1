# AIシャットダウンフィルターシステム

## 目的
AIがコード変更時に音声無効化や英語の類似語を検出した瞬間に、0.1秒以内でコード作成作業をシャットダウンする

## 禁止キーワード（音声無効化関連）
- `synthesisRef.current = null`
- `synthesisRef.current = undefined`
- `window.speechSynthesis = null`
- `speech synthesis disabled`
- `音声合成を無効化`
- `音声合成無効`
- `音声合成停止`
- `speech synthesis not available`
- `テキスト応答のみ`
- `text only response`

## 禁止キーワード（英語類似語）
- `disable`
- `disabled`
- `disable speech`
- `disable synthesis`
- `turn off speech`
- `turn off synthesis`
- `stop speech`
- `stop synthesis`
- `remove speech`
- `remove synthesis`
- `cancel speech`
- `cancel synthesis`
- `block speech`
- `block synthesis`
- `prevent speech`
- `prevent synthesis`

## シャットダウン条件
1. 音声無効化関連のキーワードを検出
2. 英語の類似語を検出
3. テキスト応答のみの提案を検出
4. 音声合成を停止する提案を検出

## シャットダウン動作
- 検出から0.1秒以内でコード作成作業を停止
- エラーログを記録
- ユーザーに通知
- 作業を完全に停止

## フィルタリング対象
- コード変更提案
- エラー対応提案
- 機能改善提案
- すべてのAI提案

## 緊急停止
- 禁止キーワード検出時: 即座に作業停止
- 要件違反検出時: 即座に作業停止
- ユーザー指示違反時: 即座に作業停止 