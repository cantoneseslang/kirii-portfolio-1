# 管理者権限の問題を解決するためのガイド

Supabaseとの連携で管理者権限（Admin: Yes/No）の表示に問題がある場合は、以下の手順で解決できます。

## 1. Supabaseでプロフィールテーブルの確認

まず、Supabaseの管理画面から以下を確認してください：

1. **`profiles`テーブルが存在するか**
2. **`is_admin`カラムが存在するか**
3. **対象ユーザーの`is_admin`値がTRUEに設定されているか**

## 2. SQLで管理者権限を直接設定する

以下のSQLを実行して、特定のユーザーに管理者権限を付与します：

```sql
-- プロファイルテーブルが存在するか確認し、なければ作成
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  department TEXT,
  position TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- is_adminカラムが存在するか確認し、なければ追加
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 現在のユーザーのプロフィールを更新
UPDATE profiles 
SET is_admin = TRUE
WHERE id = 'あなたのユーザーID'; -- ユーザーIDに置き換えてください

-- プロファイルが存在しない場合は作成
INSERT INTO profiles (id, full_name, is_admin)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  TRUE as is_admin
FROM auth.users
WHERE id = 'あなたのユーザーID' -- ユーザーIDに置き換えてください
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'あなたのユーザーID');
```

## 3. アプリケーションでの問題確認

### コンソールログの確認
ブラウザの開発者ツールを開き、コンソールに出力されているログを確認します。特に以下のログに注目してください：
- `"Admin status:"`
- `"Admin status on auth change:"`

このログを確認することで、アプリケーションがSupabaseからどのような管理者情報を取得しているか確認できます。

### キャッシュのクリア
ブラウザのキャッシュやクッキーをクリアしてから再ログインすると問題が解決する場合があります：

1. ブラウザのキャッシュをクリア
2. アプリケーションからログアウト
3. 再度ログイン

## 4. `auth-context.tsx`ファイルの確認

アプリケーションの`auth-context.tsx`ファイルで、Supabaseからの管理者情報の取得と更新が正しく行われているか確認します。特に以下の部分が重要です：

```typescript
// ユーザーがログインしている場合、管理者権限を確認
if (session?.user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()
  
  if (error) {
    console.error("Error checking admin status:", error)
    setIsAdmin(false)
  } else {
    console.log("Admin status:", data?.is_admin)
    setIsAdmin(!!data?.is_admin)
  }
}
```

正しく設定されていれば、Supabaseで管理者権限を設定した後、アプリケーションを再読み込みすると「Admin: Yes」と表示されるはずです。
