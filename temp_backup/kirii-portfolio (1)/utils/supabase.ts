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
