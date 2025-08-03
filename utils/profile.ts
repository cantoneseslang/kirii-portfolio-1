import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase as directSupabase } from "./supabase"
import type { Profile } from "@/types/profile"

// プロフィールを取得する関数
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    // 両方の方法でSupabaseクライアントを試す
    const supabase = createClientComponentClient()
    
    // プロファイルテーブルが存在するか確認
    const { count, error: tableError } = await supabase.from("profiles").select("*", { count: "exact", head: true })
    
    if (tableError) {
      // 直接Supabaseクライアントを使用して再試行
      const { data, error } = await directSupabase.from("profiles").select("*").eq("id", userId).single()
      
      if (error) {
        return null
      }
      
      return data
    }
    
    // 通常のクライアントでプロファイルを取得
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
    
    if (error) {
      // 直接Supabaseクライアントを使用して再試行
      const { data: directData, error: directError } = await directSupabase.from("profiles").select("*").eq("id", userId).single()
      
      if (directError) {
        return null
      }
      
      return directData
    }
    
    return data
  } catch (error: any) {
    return null
  }
}

// プロフィールを作成する関数
export async function createProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClientComponentClient()
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Unknown error" }
  }
}

// プロフィールテーブルの存在を確認する関数
export async function checkProfilesTable(): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()
    const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true })

    if (error && error.code === "42P01") {
      // テーブルが存在しない場合
      return false
    }
    
    if (error) {
      return false
    }

    return true
  } catch (error: any) {
    return false
  }
}

// プロフィールを更新する関数
export async function updateProfile(profile: Partial<Profile>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClientComponentClient()
    
    // まず現在のユーザーの管理者権限を確認
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return { success: false, error: "Authentication required" }
    }
    
    // 現在のユーザーのプロフィールを取得して管理者権限を確認
    const { data: currentUserProfile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()
    
    if (profileError) {
      return { success: false, error: "Failed to verify user permissions" }
    }
    
    // 管理者権限チェック
    if (!currentUserProfile?.is_admin) {
      return { success: false, error: "Unauthorized: Only administrators can update profiles" }
    }
    
    const { error } = await supabase
      .from("profiles")
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Unknown error" }
  }
}
