# 緊急修正：ログインできなくなった問題の解決策

問題が発生し、ログインできなくなったようです。以下の手順で即座に修正できます。

## 1. 元のファイルに戻す（即時対応）

すぐにログインを復元するには、修正前の状態に戻します：

### utils/supabase.ts を元に戻す

```typescript
import { createClient } from "@supabase/supabase-js"

// 環境変数またはデフォルト値を使用
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnshbcvrrzlumfomniim.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M'

// 環境変数をログに出力（デバッグ用）
console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Anon Key:", supabaseAnonKey ? "Set (length: " + supabaseAnonKey.length + ")" : "Not set")

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 接続テスト用の関数
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("profiles").select("count", { count: "exact" })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
```

### context/auth-context.tsx を元に戻す

```typescript
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { User } from "@supabase/supabase-js"

interface AuthContextProps {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnshbcvrrzlumfomniim.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M'
  )

  // 残りのコード...
}
```

## 2. バイパスモードを有効化（一時的な回避策）

現在のミドルウェア（middleware.ts）には、バイパスモードの設定が既に含まれていますが、確実に動作するよう再確認します：

```typescript
// middleware.tsの該当部分

// URLからバイパスパラメータを確認
const { searchParams } = new URL(request.url)
const bypass = searchParams.get('bypass') === 'true'

// バイパスモードが有効な場合は認証をスキップ
if (bypass) {
  return response
}
```

これにより、次のURLでダッシュボードに直接アクセスできます：
```
http://localhost:3000/dashboard?bypass=true
```

## 3. RLSポリシーを修正（根本的な解決策）

Supabaseダッシュボードで「postgres role」権限を使用して以下のSQLを実行：

```sql
-- RLSを一時的に無効化（開発環境のみ）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- または、より緩いRLSポリシーを設定
DROP POLICY IF EXISTS "Public profiles access" ON profiles;
CREATE POLICY "Public profiles access" 
ON profiles FOR ALL 
USING (true);

-- プロファイルが存在しない場合は作成
INSERT INTO profiles (id, username, full_name, department, position, is_admin)
SELECT 
  id, 
  'admin',
  'Admin User',
  'Admin',
  'Administrator',
  true
FROM auth.users
WHERE email = 'hiroki.sakon@kirii.com.hk'
ON CONFLICT (id) DO NOTHING;
```

## 4. アプリを再起動

```bash
npm run dev
```

これらの対応により、すぐにログイン機能を回復できるはずです。根本的な認証問題の解決には、Supabaseの設定とRLSポリシーの詳細な見直しが必要です。
