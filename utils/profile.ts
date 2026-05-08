import { supabase as directSupabase } from "./supabase"
import type { Profile } from "@/types/profile"

const supabase = directSupabase

// プロフィールを取得する関数
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
    if (error) {
      return null
    }
    return data
  } catch {
    return null
  }
}

// プロフィールを作成する関数
export async function createProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
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
    const { error } = await supabase.from("profiles").select("*", { count: "exact", head: true })

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
