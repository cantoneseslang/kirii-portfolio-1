"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function createUser(
  email: string,
  full_name: string,
  department: string,
  position: string,
  is_admin: boolean = false,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // 現在のユーザーが管理者かどうかチェック
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      console.error("Unauthorized: Only admins can create users")
      return { success: false, error: "Unauthorized: Only administrators can create users" }
    }
    
    // ランダムパスワードを生成
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    
    // Supabase Authでユーザーを作成
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, is_admin }
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return { success: false, error: authError.message }
    }

    // プロフィールを作成
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name,
      department,
      position,
      is_admin,
      updated_at: new Date().toISOString()
    })

    if (profileError) {
      console.error("Error creating profile:", profileError)
      return { success: false, error: profileError.message }
    }

    revalidatePath("/admin")
    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    console.error("Unexpected error in createUser:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // 現在のユーザーが管理者かどうかチェック
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      console.error("Unauthorized: Only admins can delete users")
      return { success: false, error: "Unauthorized: Only administrators can delete users" }
    }
    
    // まずprofilesテーブルからユーザー情報を削除
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id)
    
    if (profileError) {
      console.error("Error deleting profile:", profileError)
      return { success: false, error: profileError.message }
    }
    
    // 次にauth.usersテーブルからユーザーを削除
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    
    if (authError) {
      console.error("Error deleting auth user:", authError)
      return { success: false, error: authError.message }
    }
    
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in deleteUser:", error)
    return { success: false, error: error.message }
  }
}

export async function updateUserAdmin(userId: string, isAdmin: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // 現在のユーザーが管理者かどうかチェック
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      console.error("Unauthorized: Only admins can update user admin status")
      return { success: false, error: "Unauthorized: Only administrators can update user admin status" }
    }

    const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId)

    if (error) {
      console.error("Error updating user admin status:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in updateUserAdmin:", error)
    return { success: false, error: error.message }
  }
}

export async function getUsers(): Promise<{ users: any[]; error: string | null }> {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data, error } = await supabase.from("profiles").select("*").order("full_name", { ascending: true })

    if (error) {
      console.error("Error fetching users:", error)
      return { users: [], error: error.message }
    }

    return { users: data, error: null }
  } catch (error: any) {
    console.error("Unexpected error in getUsers:", error)
    return { users: [], error: error.message }
  }
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return false
    }

    const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    return data?.is_admin === true
  } catch (error: any) {
    console.error("Unexpected error in checkIsAdmin:", error)
    return false
  }
}
