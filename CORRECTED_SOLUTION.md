# Supabase認証エラー修正手順（正確なステップ）

## スクリーンショットの確認

スクリーンショットを確認すると、実際のインターフェースには「postgres role」があり、これが必要な権限設定です。

## 修正された手順（正確なステップ）

### 1. Supabaseダッシュボードにログイン
- [Supabaseダッシュボード](https://app.supabase.io/)にアクセス
- プロジェクト「mnshbcvrrzlumfomniim」を選択

### 2. SQLエディタでスクリプトを実行
- 左側メニューから「SQL Editor」を選択
- **必須**: 「Database role settings」から「**postgres role**」を選択（スクリーンショットの通り）
  - これは「デフォルトのPostgres/superuserロール」です
  - 「管理者権限」を持ち、「Row Level Security (RLS)ポリシーをバイパス」します
- 「+ New Query」ボタンをクリック
- `fixed-user-auth-solution.sql`の内容をコピー＆ペースト
- 「Run」ボタンをクリック

これだけで既存のユーザー（hiroki.sakon@kirii.com.hkなど）がログインできるようになります。
余分なテストページや修正コードは不要です。

### 3. 追加のユーザーが必要な場合

残りのユーザーも登録したい場合は、同様の手順で：
1. `all-users-import.sql`を実行（ユーザー7-13）
2. `all-users-import-part2.sql`を実行（ユーザー14-23）

## 確認方法

1. アプリにアクセス
2. 既存のアカウントでログイン（例：hiroki.sakon@kirii.com.hk / sakon0201）
3. 正常に認証されるかを確認

## なぜこれで解決するのか

Supabaseでは、認証情報（auth.users）とプロフィール情報（profiles）が別々のテーブルで管理されています。これらのテーブルへのアクセスには管理者権限が必要です。

「postgres role」設定を使用することで、Row Level Security (RLS)ポリシーをバイパスし、auth.usersテーブルを直接操作できるようになります。これにより「Database error querying schema」エラーが解消され、既存のすべてのユーザーがすぐにログインできるようになります。

---

# 最新更新履歴（2025年9月21日）

## 🎯 実施した変更点

### 1. ナビゲーション整理
- **🗣️ Cantonese Chat** - 左側ナビから削除（不要な機能）
- **Certification** - 左側ナビから削除（Product Certificateカードから直接アクセス可能）

### 2. 新しいカード追加
- **Collect Payment** / "回收金額統計表" - Sales-ERP部門に新規追加
- **権限設定**: Acc. Manager + Adminのみアクセス可能

### 3. 専用部門作成
- **Department: Account-ERP** - 新設
- **配置内容**: Collect Paymentカード
- **権限**: Acc. Manager + Adminのみ

### 4. 共通ラッパー実装
- **CollectPaymentCardWrapper** - 2箇所のカードが同時更新される仕組み
- **ファイル**: `components/collect-payment-card-wrapper.tsx`
- **メリット**: 1回の更新で両方のカードが変更される

### 5. レスポンシブロゴ実装
- **767px以下**: 新しいロゴ（`logo-mobile.png`）のみ表示
- **768px以上**: 元のロゴ + 標語を表示
- **ファイル**: `components/logo-mobile.tsx`

### 6. 暦表示改善
- **改行設定**: 「宜」「忌」の内容を6個ずつで改行
- **実装**: `formatWithLineBreaks`関数 + `whitespace-pre-line`
- **表示例**:
  ```
  宜: 开市 交易 立券 纳财 挂匾 栽种
  祭祀 祈福 开光 拆卸 动土 安床
  忌: 嫁娶 破土 进人口 出行 入宅 移徙
  出火 纳畜 词讼 安葬
  ```

### 7. レイアウト調整
- **モバイル版**: ロゴの左側に余白追加（`pl-4`）
- **行の整合性**: 左側と右側の要素が適切に整列
- **ブレークポイント**: 640px（sm）でレスポンシブ切り替え

## 🚀 デプロイ情報
- **本番URL**: https://kirii-portfolio-1-8idzv4kfm-kirii.vercel.app
- **デプロイ日**: 2025年9月21日
- **ステータス**: 成功 ✅

## 📋 権限設定一覧
- **Collect Payment**: Acc. Manager + Admin
- **Sales-ERP部門**: Sales部門 + Admin
- **Account-ERP部門**: Acc. Manager + Admin
- **Factory-ERP部門**: Factory部門 + Admin
- **Purchasing-ERP部門**: Purchasing部門 + Admin

## 🔧 技術的改善点
- シンタックスエラー修正（qr-scan-card.tsx）
- レスポンシブレイアウト最適化
- 画像ファイル管理改善
- コードの保守性向上（共通ラッパー）
