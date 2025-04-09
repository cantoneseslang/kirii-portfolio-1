"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function createUser(
  email: string,
  full_name: string,
  english_name: string,
  chinese_name: string,
  sex: string,
  department: string,
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Not implemented" }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Not implemented" }
}

export async function updateUserAdmin(userId: string, isAdmin: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerComponentClient({ cookies })

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
