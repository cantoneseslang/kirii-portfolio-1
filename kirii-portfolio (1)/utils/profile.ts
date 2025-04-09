import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Profile } from "@/types/profile"

// プロフィールを取得する関数
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getProfile:", error)
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
      console.error("Error creating profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in createProfile:", error)
    return { success: false, error: error.message }
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

    return true
  } catch (error) {
    console.error("Error checking profiles table:", error)
    return false
  }
}

// プロフィールを更新する関数
export async function updateProfile(profile: Partial<Profile>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClientComponentClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    if (error) {
      console.error("Error updating profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in updateProfile:", error)
    return { success: false, error: error.message }
  }
}

