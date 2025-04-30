# Supabase認証システムの完全修正

## 1. システム概要

KIRIIポートフォリオ管理システムは、セキュアで効率的な認証システムを必要としています。このドキュメントでは、Supabaseを使用した認証システムの実装について詳細に説明します。

主な特徴：
- セキュアなユーザー認証
- JWTベースのセッション管理
- Row Level Security (RLS)による堅牢なデータ保護
- スケーラブルなユーザー管理

## 2. 要件定義

### 2.1 機能要件
- ユーザー登録・ログイン機能
- パスワードリセット機能
- セッション管理
- ユーザープロファイル管理
- 権限管理システム

### 2.2 非機能要件
- セキュリティ要件
  - データの暗号化
  - セキュアなパスワード管理
  - アクセス制御
- パフォーマンス要件
  - 応答時間 < 1秒
  - 同時接続ユーザー数: 100人以上
- 可用性要件
  - システム稼働率 99.9%以上
  - バックアップ・リカバリー体制

## 3. 技術スタック

### 3.1 フロントエンド
- Next.js 13 (App Router)
- TypeScript
- TailwindCSS
- Supabase Client

### 3.2 バックエンド
- Supabase
- PostgreSQL
- Node.js

### 3.3 認証・認可
- Supabase Auth
- JWT
- Row Level Security (RLS)

### 3.4 開発ツール
- Git
- VS Code
- Supabase CLI

## 4. システムアーキテクチャ

### データベース構造
1. システムテーブル（auth.users）
   - ユーザー認証情報
   - セッション管理
   - パスワード管理

2. カスタムテーブル（profiles）
   - ユーザープロフィール情報
   - 部門情報
   - 権限設定

### データベースロール
- postgres: スーパーユーザー権限
- authenticated: 認証済みユーザー用
- anon: 未認証ユーザー用

## 5. 実装ガイド

### 5.1 初期設定
```typescript
// supabase-client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 5.2 認証機能の実装
```typescript
// auth.ts
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}
```

### 5.3 ミドルウェアの設定
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  return res
}
```

### 5.4 RLSポリシーの設定
```sql
-- RLSポリシーの例
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = user_id);
```

## 6. トラブルシューティング

### 6.1 一般的な問題と解決策

#### 認証エラー
- エラー: "Invalid JWT token"
  - 解決: セッションの有効期限を確認
  - トークンの再取得を実行

#### データベースエラー
- エラー: "Permission denied"
  - 解決: RLSポリシーの確認
  - ユーザー権限の見直し

#### パフォーマンス問題
- 問題: 遅いレスポンス時間
  - 解決: インデックスの最適化
  - クエリの見直し

### 6.2 デバッグガイド

#### クライアントサイド
```typescript
// デバッグログの有効化
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)
})
```

#### サーバーサイド
```sql
-- セッション情報の確認
SELECT * FROM auth.sessions WHERE user_id = '[user_id]';

-- RLSポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### 6.3 緊急時の対応手順
1. システムログの確認
2. エラーの特定と分類
3. 影響範囲の評価
4. 一時的な回避策の実施
5. 恒久的な解決策の実装

## 7. パフォーマンス最適化

### インデックス設定
```sql
-- 既存のインデックスの確認
SELECT * FROM pg_indexes WHERE tablename = 'profiles';

-- 必要なインデックスの追加
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
```

### クエリ最適化
```sql
-- 非効率なクエリ
SELECT * FROM profiles WHERE username LIKE '%search%';

-- 最適化されたクエリ
SELECT id, username, email 
FROM profiles 
WHERE username ILIKE 'search%'
LIMIT 100;
```

## 8. デバッグガイド

### クライアントサイドデバッグ
```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { debug: true }
})
```

### サーバーサイドログ
```sql
-- 認証ログの確認
SELECT * FROM auth.audit_log_entries
ORDER BY created_at DESC
LIMIT 10;

-- エラーログの確認
SELECT * FROM auth.audit_log_entries
WHERE error IS NOT NULL
ORDER BY created_at DESC;
```

## 緊急時の対応手順

### 1. バイパスモードの有効化
```typescript
// middleware.tsの該当部分
const { searchParams } = new URL(request.url)
const bypass = searchParams.get('bypass') === 'true'

if (bypass) {
  return response
}
```

### 2. プロジェクトの再起動
1. Supabaseダッシュボードにアクセス
2. Database > Settings > Restart Database
3. 再起動完了を確認

### 3. JWTシークレットの更新
1. Project Settings > API
2. JWT Settingsで新しいシークレットを生成
3. 環境変数を更新

## 9. メンテナンスと監視

### 9.1 定期メンテナンス
- バックアップの確認と検証
- セキュリティパッチの適用
- パフォーマンス指標の確認
- ユーザーアクセスログの分析

### 9.2 監視項目
- システムの稼働状態
- 認証の成功/失敗率
- データベースのパフォーマンス
- APIのレスポンスタイム
- エラーレートとタイプ

### 9.3 アラート設定
```typescript
// 監視設定例
const ALERT_THRESHOLDS = {
  errorRate: 0.05, // 5%以上のエラー率でアラート
  responseTime: 1000, // 1秒以上の応答時間でアラート
  failedLogins: 10, // 10回以上の連続ログイン失敗でアラート
}
```

### 9.4 定期チェックリスト
1. セキュリティ監査
   - アクセスログの確認
   - 不正アクセスの検知
   - 権限設定の見直し

2. パフォーマンス監査
   - クエリパフォーマンスの分析
   - リソース使用率の確認
   - キャッシュヒット率の確認

3. バックアップ検証
   - バックアップの整合性確認
   - リストア手順の確認
   - 災害復旧計画の更新

### 9.5 メンテナンス手順
```sql
-- データベースの状態確認
SELECT schemaname, tablename, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- テーブルの最適化
VACUUM ANALYZE profiles;

-- インデックスの再構築
REINDEX TABLE profiles;
```

### 9.6 監視ダッシュボード設定
```typescript
// 監視メトリクスの定義
interface MonitoringMetrics {
  activeUsers: number;
  authSuccess: number;
  authFailure: number;
  avgResponseTime: number;
  errorCount: number;
  databaseConnections: number;
}

// メトリクス収集関数
async function collectMetrics(): Promise<MonitoringMetrics> {
  // メトリクス収集ロジック
  return {
    activeUsers: await getActiveUsers(),
    authSuccess: await getAuthSuccessCount(),
    authFailure: await getAuthFailureCount(),
    avgResponseTime: await getAverageResponseTime(),
    errorCount: await getErrorCount(),
    databaseConnections: await getDatabaseConnections(),
  }
}
```

### 9.7 インシデント対応計画
1. 検知フェーズ
   - 異常の検知と分類
   - 影響範囲の特定
   - 優先度の判定

2. 対応フェーズ
   - 一時的な対策の実施
   - ステークホルダーへの通知
   - 根本原因の分析

3. 復旧フェーズ
   - 恒久的な解決策の実装
   - システムの正常性確認
   - 再発防止策の策定

4. 振り返りフェーズ
   - インシデントレポートの作成
   - 教訓の文書化
   - 改善計画の立案
