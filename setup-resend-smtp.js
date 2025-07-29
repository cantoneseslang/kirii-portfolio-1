const PROJECT_REF = 'mnshbcvrrzlumfomniim'

console.log("🚀 Resend SMTP設定をSupabaseに適用します...")

// ResendのAPI Keyを入力してください
const RESEND_API_KEY = process.argv[2]
const FROM_EMAIL = process.argv[3] || 'noreply@kirii.com.hk'

if (!RESEND_API_KEY) {
  console.log("❌ 使用方法:")
  console.log("node setup-resend-smtp.js [RESEND_API_KEY] [FROM_EMAIL]")
  console.log("")
  console.log("例:")
  console.log("node setup-resend-smtp.js re_ABC123xyz noreply@kirii.com.hk")
  process.exit(1)
}

// Supabase Management API用の設定
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!SUPABASE_ACCESS_TOKEN) {
  console.log("❌ SUPABASE_ACCESS_TOKENが設定されていません")
  console.log("以下のURLでアクセストークンを作成してください:")
  console.log("https://supabase.com/dashboard/account/tokens")
  console.log("")
  console.log("その後、以下のコマンドで設定してください:")
  console.log("export SUPABASE_ACCESS_TOKEN='your-access-token'")
  process.exit(1)
}

async function setupResendSMTP() {
  try {
    console.log(`\n📧 SMTP設定:`)
    console.log(`- Host: smtp.resend.com`)
    console.log(`- Port: 587`)
    console.log(`- Username: resend`)
    console.log(`- From Email: ${FROM_EMAIL}`)
    
    const config = {
      "external_email_enabled": true,
      "mailer_secure_email_change_enabled": true,
      "mailer_autoconfirm": false,
      "smtp_admin_email": FROM_EMAIL,
      "smtp_host": "smtp.resend.com",
      "smtp_port": 587,
      "smtp_user": "resend",
      "smtp_pass": RESEND_API_KEY,
      "smtp_sender_name": "Kirii Portfolio"
    }
    
    console.log("\n⚙️ Supabaseに設定を適用中...")
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${response.status} - ${error}`)
    }
    
    const result = await response.json()
    console.log("✅ SMTP設定が正常に適用されました!")
    
    console.log("\n🎉 設定完了!")
    console.log("📧 パスワードリセット機能が正常に動作するはずです")
    console.log("\n🔧 次のステップ:")
    console.log("1. パスワードリセット機能をテストしてください")
    console.log("2. Rate Limitを調整してください (必要に応じて)")
    console.log("3. https://supabase.com/dashboard/project/mnshbcvrrzlumfomniim/auth/rate-limits")
    
  } catch (error) {
    console.error("❌ エラー:", error.message)
    console.log("\n💡 トラブルシューティング:")
    console.log("1. Resend API Keyが正しいか確認してください")
    console.log("2. Supabase Access Tokenが有効か確認してください")
    console.log("3. FROM_EMAILドメインがResendで認証済みか確認してください")
  }
}

setupResendSMTP() 