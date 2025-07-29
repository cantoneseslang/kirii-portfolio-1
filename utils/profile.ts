import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase as directSupabase } from "./supabase"
import type { Profile } from "@/types/profile"

// プロフィールを取得する関数
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    console.log("Attempting to fetch profile for user ID:", userId)
    
    // 両方の方法でSupabaseクライアントを試す
    const supabase = createClientComponentClient()
    
    console.log("Supabase client created, attempting to query profiles table")
    
    // プロファイルテーブルが存在するか確認
    const { count, error: tableError } = await supabase.from("profiles").select("*", { count: "exact", head: true })
    
    if (tableError) {
      console.error("Error checking profiles table:", tableError)
      
      // 直接Supabaseクライアントを使用して再試行
      console.log("Retrying with direct Supabase client")
      const { data, error } = await directSupabase.from("profiles").select("*").eq("id", userId).single()
      
      if (error) {
        console.error("Error fetching profile with direct client:", error.code, error.message, error.details)
        return null
      }
      
      console.log("Profile data retrieved with direct client:", data)
      return data
    }
    
    // 通常のクライアントでプロファイルを取得
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
    
    if (error) {
      console.error("Error fetching profile:", error.code, error.message, error.details)
      // 直接Supabaseクライアントを使用して再試行
      console.log("Retrying with direct Supabase client after error")
      const { data: directData, error: directError } = await directSupabase.from("profiles").select("*").eq("id", userId).single()
      
      if (directError) {
        console.error("Error fetching profile with direct client after retry:", directError.code, directError.message, directError.details)
        return null
      }
      
      console.log("Profile data retrieved with direct client after retry:", directData)
      return directData
    }
    
    console.log("Profile data retrieved:", data)
    return data
  } catch (error: any) {
    console.error("Unexpected error in getProfile:", error?.message || error)
    return null
  }
}

// プロフィールを作成する関数
export async function createProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Attempting to create profile for user ID:", userId)
    const supabase = createClientComponentClient()
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error creating profile:", error.code, error.message, error.details)
      return { success: false, error: error.message }
    }

    console.log("Profile created successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in createProfile:", error?.message || error)
    return { success: false, error: error?.message || "Unknown error" }
  }
}

// プロフィールテーブルの存在を確認する関数
export async function checkProfilesTable(): Promise<boolean> {
  try {
    console.log("Checking if profiles table exists")
    const supabase = createClientComponentClient()
    const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true })

    if (error && error.code === "42P01") {
      // テーブルが存在しない場合
      console.error("Profiles table does not exist:", error.message)
      return false
    }
    
    if (error) {
      console.error("Error checking profiles table:", error.code, error.message, error.details)
      return false
    }

    console.log("Profiles table exists, count:", count)
    return true
  } catch (error: any) {
    console.error("Error checking profiles table:", error?.message || error)
    return false
  }
}

// プロフィールを更新する関数
export async function updateProfile(profile: Partial<Profile>): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Attempting to update profile for ID:", profile.id)
    const supabase = createClientComponentClient()
    
    // まず現在のユーザーの管理者権限を確認
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.error("No authenticated session found")
      return { success: false, error: "Authentication required" }
    }
    
    // 現在のユーザーのプロフィールを取得して管理者権限を確認
    const { data: currentUserProfile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()
    
    if (profileError) {
      console.error("Error fetching current user profile:", profileError)
      return { success: false, error: "Failed to verify user permissions" }
    }
    
    // 管理者権限チェック
    if (!currentUserProfile?.is_admin) {
      console.error("Unauthorized: User is not an admin")
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
      console.error("Error updating profile:", error.code, error.message, error.details)
      return { success: false, error: error.message }
    }

    console.log("Profile updated successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in updateProfile:", error?.message || error)
    return { success: false, error: error?.message || "Unknown error" }
  }
}
