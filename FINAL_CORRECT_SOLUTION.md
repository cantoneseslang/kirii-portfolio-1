# Supabase認証エラー「Database error querying schema」最終解決策

## スクリーンショットで確認した正確なロール設定

Supabaseダッシュボードには以下の3つのデータベースロールしか存在しません：

1. **postgres role** - "The default Postgres/superuser role. This has admin privileges. It will bypass Row Level Security (RLS) policies."
2. **anon role**
3. **authenticated role**

## 正確な解決手順

### 1. Supabaseダッシュボードにアクセス
- [Supabaseダッシュボード](https://app.supabase.io/)にログイン
- プロジェクト「mnshbcvrrzlumfomniim」を選択

### 2. SQLを実行
- 左側メニューから「SQL Editor」を選択
- **重要**: 「Database role settings」から「**postgres role**」を選択
  - これは「デフォルトのPostgres/スーパーユーザーロール」
  - 「管理者権限」があり、「RLSポリシーをバイパス」できる
- 「+ New Query」ボタンをクリック
- 以下のSQL（postgres-role-rls-fix.sql）を実行：

```sql
-- RLSを一時的に無効化（最も確実な解決方法）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- あるいは、最も緩いポリシーを設定
DROP POLICY IF EXISTS "Public profiles access" ON profiles;
CREATE POLICY "Public profiles access" 
ON profiles FOR ALL 
USING (true);

-- 管理者ユーザーのプロファイルを確保
INSERT INTO profiles (id, username, full_name, department, position, is_admin)
SELECT id, 'admin_user', 'Hiroki Sakon', 'Admin', 'General Manager', true
FROM auth.users
WHERE email = 'hiroki.sakon@kirii.com.hk'
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  updated_at = now();

-- 確認
SELECT * FROM profiles LIMIT 10;
```

### 3. アプリを再起動して確認
- ブラウザに戻り、ページを更新
- ログインを試す：hiroki.sakon@kirii.com.hk / sakon0201

## この方法が有効な理由

「Database error querying schema」エラーの原因は、Supabaseの認証システムがデータベーススキーマにアクセスできないことです。

1. **postgres role** を使用することで、RLSポリシーをバイパスできます
2. RLSを無効化することで、認証システムがデータベースのスキーマ情報にアクセスできるようになります
3. 必要なプロファイルデータを確実に挿入することで、ユーザー情報の整合性を確保できます

## RLSポリシーについて

Row Level Security (RLS)は、行レベルでのデータアクセスを制限する機能です：

- **デフォルト動作**: テーブルにRLSを有効化すると、明示的なポリシーがない限りすべてのアクセスが拒否されます
- **postgres role**: このロールはRLSをバイパスできる特別な権限を持っています
- **セキュリティと利便性のバランス**: 開発中はRLSを無効化し、本番環境ではより適切なポリシーを設定するとよいでしょう

この解決策は、Supabaseの内部認証メカニズムに直接アクセスし、問題を根本から解決します。
