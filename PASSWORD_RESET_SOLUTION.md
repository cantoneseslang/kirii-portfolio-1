れも# パスワード問題かバイパス認証による緊急対応策

同じエラーが続いており、データベース設定の修正だけでは解決しない可能性があります。パスワード関連の問題またはより深刻な認証問題の可能性を考慮して、直接的な解決策を提案します。

## 緊急解決策（認証バイパス）

既存の認証システムに問題がある場合、一時的に認証をバイパスします。

### 1. middleware.tsにバイパスコードを追加

```typescript
// middleware.ts
// URLからバイパスパラメータの存在を確認
const url = new URL(request.url)
const bypass = url.searchParams.get('bypass') === 'true'

// バイパスモードが有効な場合、認証チェックを完全にスキップ
if (bypass) {
  console.log("認証バイパスモードで動作中")
  return NextResponse.next()
}

// 既存の認証コード...
```

これで次のURLでダッシュボードに直接アクセスできます：
```
http://localhost:3000/dashboard?bypass=true
```

## パスワードリセット対応

パスワードに問題がある可能性も考えられます。Supabaseのパスワードには以下の制限があります：
- 最小6文字
- 特定の文字制限（通常はASCII文字のみ）

### 1. postgres roleでパスワードをリセット

```sql
-- postgres role権限で実行
UPDATE auth.users
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'hiroki.sakon@kirii.com.hk';
```

### 2. APIを使ったパスワードリセット

新しいファイル `reset-password.js` を作成：

```javascript
// reset-password.js
const { createClient } = require('@supabase/supabase-js')

// サービスロールキーを使用（必須）
const supabase = createClient(
  'https://mnshbcvrrzlumfomniim.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgzOTYwOSwiZXhwIjoyMDU5NDE1NjA5fQ.zIIn4hdZxG_eMlNMtrD4dcnEWCv5duma7IXQVx-4x5c'
)

async function resetPassword() {
  // 1. adminでユーザー更新
  const { data, error } = await supabase.auth.admin.updateUserById(
    '3f77c95e-2068-42d1-a368-633c04f407d4', // hiroki.sakonのユーザーID
    { password: 'newpassword123' }
  )
  
  console.log('パスワードリセット結果:', error ? 'エラー: ' + error.message : '成功')
}

resetPassword()
```

実行方法：
```bash
node reset-password.js
```

## 全く新しいユーザーの作成

最後の手段として、新しいユーザーを作成してデモ用として使用できます。

```sql
-- Supabaseダッシュボードでpostgres role権限で実行

-- 1. 新しいユーザーを作成
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'demo@kirii.com.hk',
  crypt('demo1234', gen_salt('bf')),
  NOW(),
  null,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) RETURNING id;

-- 2. 返ってきたIDを使ってプロファイルを作成
INSERT INTO profiles (id, username, full_name, is_admin)
VALUES ('返ってきたID', 'demo', 'Demo User', true);
```

