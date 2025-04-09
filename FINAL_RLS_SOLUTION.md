# Supabase RLS問題の最終解決策

## 問題の根本原因

「Database error querying schema」エラーは、Supabaseの**Row Level Security (RLS)ポリシー**とプロファイルデータの不整合が原因でした。

## 重要な問題ポイント

1. **RLSポリシーの問題**:
   - Supabaseではデフォルトでテーブルにアクセス制限がかかる
   - 適切なRLSポリシーがないとデータにアクセスできない
   - `profiles`テーブルのRLSポリシー設定が不適切

2. **プロファイルデータの欠落**:
   - ユーザーは`auth.users`テーブルには存在するが、`profiles`テーブルにデータがない
   - 認証システムはプロファイルデータを前提として動作している

3. **一貫性のないデータアクセス権限**:
   - 通常のクエリでは、RLSポリシーによりアクセスが制限される
   - RLSをバイパスするには管理者権限（postgres role）が必要

## 実施した解決策

### 1. RLSポリシーの修正

```sql
-- 認証済みユーザーが自分のプロファイルデータを読み取れるように
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 認証済みユーザーが自分のプロファイルを更新できるように
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 認証済みユーザーが自分のプロファイルを作成できるように
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 管理者が全プロファイルを表示できるように
CREATE POLICY "Admin can view all profiles"
ON profiles FOR SELECT
USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);
```

### 2. 管理者プロファイルデータの追加

```sql
-- postgres role権限で実行
INSERT INTO profiles (id, full_name, is_admin)
VALUES ('3f77c95e-2068-42d1-a368-633c04f407d4', 'Hiroki Sakon', TRUE)
ON CONFLICT (id) 
DO UPDATE SET 
  is_admin = TRUE,
  full_name = 'Hiroki Sakon',
  updated_at = NOW();
```

### 3. Supabaseクライアントの修正

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
```

## 今後同様の問題が発生した場合の対処法

1. **管理者権限でSQLを実行**:
   - Supabaseダッシュボードで「postgres role」を選択
   - SQL Editorを使用して直接データを操作

2. **RLSポリシーの確認と修正**:
   ```sql
   -- 現在のポリシーを確認
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   
   -- 必要に応じてポリシーを追加/修正
   CREATE POLICY "ポリシー名" ON テーブル名 FOR 操作 USING (条件);
   ```

3. **管理者ステータス同期ツールの使用**:
   - アプリの「管理者ステータスデバッガー」機能を使用
   - 「接続更新&データ再取得」ボタンでデータを強制的に再読み込み

## Supabase RLSの理解を深めるために

Row Level Securityは、データベースレベルでのセキュリティ機能です：

- **RLSの基本原則**: テーブルへのアクセスをユーザーごとに行レベルで制限
- **RLSのデフォルト動作**: RLS有効時、明示的なポリシーがない限りアクセス不可
- **ポリシーの種類**: SELECT/INSERT/UPDATE/DELETEの各操作に対して個別に設定可能
- **権限階層**: postgres roleはRLSをバイパスできる最上位権限

この問題は、Supabaseの認証システムとRLSポリシーの連携を理解する良い機会となりました。今後は、データ構造の変更時にRLSポリシーの整合性確認を忘れないようにしましょう。
