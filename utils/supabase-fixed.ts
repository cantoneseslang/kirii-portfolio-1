import { createClient } from "@supabase/supabase-js"

// 環境変数またはハードコードされた値を使用（環境変数が効いていない可能性があるため）
const supabaseUrl = 'https://mnshbcvrrzlumfomniim.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M'

// 環境変数をログに出力（デバッグ用）
console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Anon Key:", supabaseAnonKey ? "Set (length: " + supabaseAnonKey.length + ")" : "Not set")

// Supabaseクライアントを作成（オプションを追加）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// 初期化時に接続テスト（async IIFEを使用）
;(async () => {
  try {
    const result = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    console.log("Supabase connection test:", result.error ? "Error" : "Success")
    if (result.error) console.error("Connection test error:", result.error.message)
  } catch (e: any) {
    console.error("Supabase connection test failed:", e.message)
  }
})()

// 接続テスト用のエクスポート関数
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("profiles").select("count", { count: "exact" })

    if (error) {
      console.error("Connection test error:", error.message)
      return { success: false, error: error.message }
    }

    console.log("Connection test success:", data)
    return { success: true, data }
  } catch (e: any) {
    console.error("Connection test exception:", e.message)
    return { success: false, error: e.message }
  }
}
