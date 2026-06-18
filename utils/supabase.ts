import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mnshbcvrrzlumfomniim.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M"

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("profiles").select("count", { count: "exact" })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}
