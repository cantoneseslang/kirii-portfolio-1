const { createClient } = require("@supabase/supabase-js")

// Supabaseの設定
const supabaseUrl = 'https://mnshbcvrrzlumfomniim.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M'

console.log("🔑 パスワードリセット機能テストを開始します...")

// Supabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testPasswordReset() {
  try {
    const testEmail = 'hiroki.sakon@kirii.com.hk'
    
    console.log(`\n📧 ${testEmail} にパスワードリセットメールを送信中...`)
    
    // パスワードリセットメールを送信
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${supabaseUrl.replace('https://', 'http://localhost:3000')}/reset-password-confirmation`,
    })

    if (error) {
      console.log("❌ パスワードリセットエラー:", error.message)
      console.log("エラー詳細:", error)
      
      // 一般的なエラーの診断
      if (error.message.includes('User not found')) {
        console.log("💡 診断: ユーザーが見つかりません")
      } else if (error.message.includes('Email not confirmed')) {
        console.log("💡 診断: メールアドレスが確認されていません")
      } else if (error.message.includes('SMTP')) {
        console.log("💡 診断: メール送信設定に問題があります")
      }
    } else {
      console.log("✅ パスワードリセットメール送信成功")
      console.log("データ:", data)
    }

    // Supabase設定確認
    console.log("\n⚙️ Supabase設定確認:")
    console.log("- プロジェクトURL:", supabaseUrl)
    console.log("- リダイレクトURL:", `http://localhost:3000/reset-password-confirmation`)
    
    // 認証設定のテスト
    console.log("\n🔐 認証設定テスト:")
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log("認証状態エラー:", authError.message)
    } else {
      console.log("現在の認証状態:", user ? "ログイン済み" : "未ログイン")
    }

  } catch (error) {
    console.error("💥 予期しないエラー:", error.message)
    console.error("スタックトレース:", error.stack)
  }
}

// テスト実行
testPasswordReset()
  .then(() => {
    console.log("\n🎉 パスワードリセットテスト完了!")
    console.log("\n💡 次のステップ:")
    console.log("1. Supabaseダッシュボードでメール設定を確認")
    console.log("2. Auth > Settings でSMTP設定をチェック")
    console.log("3. Auth > Users でユーザーの状態を確認")
  })
  .catch((error) => {
    console.error("💥 テスト実行エラー:", error)
  }) 