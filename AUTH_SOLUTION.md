# Supabase認証システムの完全解決ガイド

## 問題の概要
- 「Database error querying schema」エラーが発生し、ユーザーがログインできない
- 一部のユーザーのみログイン可能で、他のユーザーではログインできない
- ログイン後のリダイレクトループが発生する場合がある

## 即時解決手順（クイックフィックス）

### 1. ミドルウェアの無効化（リダイレクトループ対策）
```bash
mv middleware.ts middleware.ts.disabled
```

### 2. Supabaseダッシュボードでの作業
1. [Supabaseダッシュボード](https://app.supabase.io/)にログイン
2. プロジェクト「mnshbcvrrzlumfomniim」を選択
3. 左側メニューから「SQL Editor」を選択
4. **重要**: 画面右上の「Database role settings」から「**postgres role**」を選択
   - これは管理者権限を持ち、RLSポリシーをバイパスできます

### 3. 基本的なSQLの実行
```sql
-- 1. テーブル構造の修正
DROP TABLE IF EXISTS profiles;
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  full_name TEXT,
  department TEXT,
  position TEXT,
  is_admin BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. RLS設定の修正
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. NULLトークンフィールドの修正
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
```

## 根本的な解決手順

### 1. Supabaseプロジェクトの再起動
1. Supabaseダッシュボードで「Project Settings」に移動
2. 「Database」セクションを見つける
3. 「Restart database」を実行

### 2. JWTシークレットの確認と更新
1. 「Project Settings」>「API」に移動
2. 「JWT Settings」を確認
3. 必要に応じて「Reset JWT secret」を実行

### 3. 環境変数の更新
```env
NEXT_PUBLIC_SUPABASE_URL=https://mnshbcvrrzlumfomniim.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
SUPABASE_JWT_SECRET=[your-jwt-secret]
```

### 4. RLSポリシーの設定
```sql
-- 基本的なアクセス権限
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 管理者用の追加権限
CREATE POLICY "Admin can view all profiles"
ON profiles FOR SELECT
USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);
```

## 一時的なバイパス機能（緊急時用）

必要な場合は、以下のバイパスを実装できます：

```typescript
// middleware.tsに追加
const url = new URL(request.url)
const bypass = url.searchParams.get('bypass') === 'true'

if (bypass) {
  console.log("バイパスモードでアクセス")
  return NextResponse.next()
}
```

アクセス方法: `/dashboard?bypass=true`

## テストアカウント

1. **管理者**:
   - Email: hiroki.sakon@kirii.com.hk
   - Password: sakon0201

2. **一般ユーザー**:
   - Email: alexwong@kirii.com.hk
   - Password: mVb{bZYXXUAk

## トラブルシューティング

### 1. 権限エラー
- postgres roleが選択されているか確認
- Supabaseプロジェクトの所有者でログインしているか確認

### 2. データベースエラー
- テーブル構造が正しいか確認
- NULLトークンが修正されているか確認
- RLSポリシーが適切に設定されているか確認

### 3. 認証エラー
- 環境変数が正しく設定されているか確認
- JWTシークレットが有効か確認
- ミドルウェアの設定を確認

## 解決策が有効な理由

1. **postgres roleの使用**:
   - 管理者権限でのアクセスを確保
   - RLSポリシーのバイパスが可能

2. **テーブル構造の修正**:
   - 一貫性のあるデータ構造を確保
   - 必要なフィールドの存在を保証

3. **NULLトークンの修正**:
   - 認証システムの内部エラーを防止
   - データの整合性を確保

4. **RLSポリシーの適切な設定**:
   - セキュリティを確保しながら必要なアクセスを許可
   - 管理者と一般ユーザーの権限を適切に分離 