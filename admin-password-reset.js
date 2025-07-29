const { createClient } = require("@supabase/supabase-js")

// サービスロールキーを使用（管理者権限）
const supabaseUrl = 'https://mnshbcvrrzlumfomniim.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgzOTYwOSwiZXhwIjoyMDU5NDE1NjA5fQ.zIIn4hdZxG_eMlNMtrD4dcnEWCv5duma7IXQVx-4x5c'

console.log("🔧 管理者権限でパスワードリセットを実行します...")

// 管理者クライアントを作成
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetUserPassword() {
  try {
    const userEmail = 'hiroki.sakon@kirii.com.hk'
    const newPassword = 'TempPassword123!' // 一時的なパスワード
    
    console.log(`\n👤 ${userEmail} のパスワードをリセット中...`)
    
    // まずユーザーを検索
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error("❌ ユーザー一覧取得エラー:", listError.message)
      return
    }
    
    const user = users.users.find(u => u.email === userEmail)
    
    if (!user) {
      console.log("❌ ユーザーが見つかりません:", userEmail)
      return
    }
    
    console.log("✅ ユーザー見つかりました:", user.id)
    
    // パスワードを更新
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    })
    
    if (error) {
      console.error("❌ パスワード更新エラー:", error.message)
      return
    }
    
    console.log("✅ パスワード更新成功!")
    console.log(`\n🔑 新しいログイン情報:`)
    console.log(`メール: ${userEmail}`)
    console.log(`パスワード: ${newPassword}`)
    console.log(`\n⚠️  セキュリティのため、ログイン後すぐにパスワードを変更してください。`)
    
  } catch (error) {
    console.error("💥 予期しないエラー:", error.message)
    console.error("スタックトレース:", error.stack)
  }
}

// 実行
resetUserPassword()
  .then(() => {
    console.log("\n🎉 パスワードリセット処理完了!")
  })
  .catch((error) => {
    console.error("💥 処理実行エラー:", error)
  }) 