えconst { createClient } = require("@supabase/supabase-js")

// Supabaseの設定
const supabaseUrl = 'https://mnshbcvrrzlumfomniim.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M'

console.log("🚀 Supabase接続テストを開始します...")
console.log("URL:", supabaseUrl)
console.log("Key length:", supabaseAnonKey.length)

// Supabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function testConnection() {
  try {
    console.log("\n📊 テーブル一覧を取得中...")
    
    // まず、profilesテーブルの存在確認
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (profilesError) {
      console.log("❌ profilesテーブルエラー:", profilesError.message)
    } else {
      console.log("✅ profilesテーブル接続成功")
    }

    // 一般的なテーブル操作をテスト
    console.log("\n🔍 基本的なクエリテスト...")
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log("❌ クエリエラー:", error.message)
      console.log("エラー詳細:", error)
    } else {
      console.log("✅ クエリ成功")
      console.log("データ例:", data ? data.length + " 件のレコード" : "データなし")
    }

    // 認証状態の確認
    console.log("\n🔐 認証状態確認...")
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log("❌ 認証エラー:", authError.message)
    } else {
      console.log("✅ 認証状態:", user ? "ログイン済み" : "未ログイン")
    }

    // ダッシュボード情報
    console.log("\n📈 Supabaseダッシュボード情報:")
    console.log("- プロジェクトURL:", supabaseUrl)
    console.log("- 管理画面:", supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', ''))

  } catch (error) {
    console.error("💥 予期しないエラー:", error.message)
    console.error("スタックトレース:", error.stack)
  }
}

// テスト実行
testConnection()
  .then(() => {
    console.log("\n🎉 Supabase接続テスト完了!")
  })
  .catch((error) => {
    console.error("💥 テスト実行エラー:", error)
  })
