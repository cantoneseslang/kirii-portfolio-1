# Supabase認証エラーの直接的な修正手順

「Database error querying schema」エラーを根本的に解決するための具体的な手順です。バイパスではなく、認証システム自体を修正します。

## 1. Supabaseクライアントコードの修正

**utils/supabase.ts**ファイルを以下のように修正：

```typescript
import { createClient } from "@supabase/supabase-js"

// 直接ハードコードされた値を使用
const supabaseUrl = 'https://mnshbcvrrzlumfomniim.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M'

// 認証関連オプションを追加して新しいクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
```

## 2. 認証プロバイダーの修正（context/auth-context.tsx）

```typescript
// context/auth-context.tsx の一部を修正

// 変更前:
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '...',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '...'
)

// 変更後:
import { supabase } from "@/utils/supabase" // 修正した共通のクライアントを使用
```

## 3. ログインフォームの修正（components/login-form.tsx）

```typescript
// components/login-form.tsx の一部を修正

// 変更前:
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '...',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '...'
)

// 変更後:
import { supabase } from "@/utils/supabase" // 修正した共通のクライアントを使用
```

## 4. ミドルウェアの修正（middleware.ts）

```typescript
// middleware.ts の一部を修正

// 変更前:
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '...',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '...',
  { ... }
)

// 変更後:
// 注: サーバー側では utils/supabase からのインポートはできないため、
// 直接値を使用する必要があります
const supabase = createServerClient(
  'https://mnshbcvrrzlumfomniim.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M',
  { ... 既存のCookieオプション... }
)
```

## 5. Supabaseプロジェクトの再起動

Supabaseダッシュボードから:
1. Project Settings > Database に移動
2. "Restart database" を実行

## 6. アプリの再起動

```bash
npm run dev
```

これらの修正は、以下の問題に対処します:
- 複数の場所でSupabaseクライアントを作成することによる不整合
- 環境変数の読み込み問題
- Supabase認証サービスの設定問題

## テスト方法

修正後、ログインフォームで認証をテストします:
- メールアドレス: hiroki.sakon@kirii.com.hk
- パスワード: sakon0201

## 補足: データベースエラー修正

上記の修正でも問題が解決しない場合は、Supabaseダッシュボードの「SQL Editor」で、「postgres role」権限を選択して`fixed-user-auth-solution.sql`を実行してください。

```sql
-- スクリプトの主要部分（抜粋）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  full_name TEXT,
  ...
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの設定
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 既存ユーザーのプロフィールを確保
INSERT INTO profiles (id, username, full_name, ...)
SELECT id, 'User Name', 'Full Name', ...
FROM auth.users
WHERE email = 'hiroki.sakon@kirii.com.hk'
ON CONFLICT (id) DO UPDATE SET ...;
