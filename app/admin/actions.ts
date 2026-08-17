"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import type { CardPermissionKey } from "@/lib/card-permissions"
import {
  buildCardPermissionsPatch,
  setDepartmentToken,
  type DepartmentPermissionKey,
} from "@/lib/card-permissions"
import type { Profile } from "@/types/profile"
import { fetchLunchOrderActivity, type LunchOrderActivityRow } from "@/lib/lunch-order-admin"
import { resolveLunchMemberId } from "@/lib/lunch-member"
import { getHongKongMonthToDateRange } from "@/lib/hong-kong-date"
import { createServerSupabaseClient } from "@/utils/supabase/server"

export async function createUser(
  email: string,
  full_name: string,
  department: string,
  position: string,
  is_admin: boolean = false,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      return { success: false, error: "Unauthorized: Only administrators can create users" }
    }
    
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, is_admin }
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name,
      department,
      position,
      is_admin,
      is_active: true,
      card_permissions: {},
      updated_at: new Date().toISOString()
    })

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    await logAdminActivity({
      eventType: "admin_change",
      resourceKey: "create_user",
      resourceLabel: full_name,
      metadata: { email, department, position, is_admin },
    })

    revalidatePath("/admin")
    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      return { success: false, error: "Unauthorized: Only administrators can delete users" }
    }
    
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id)
    
    if (profileError) {
      return { success: false, error: profileError.message }
    }
    
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    
    if (authError) {
      return { success: false, error: authError.message }
    }

    await logAdminActivity({
      eventType: "admin_change",
      resourceKey: "delete_user",
      metadata: { userId: id },
    })
    
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUserAdmin(userId: string, isAdmin: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      return { success: false, error: "Unauthorized: Only administrators can update user admin status" }
    }

    const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    await logAdminActivity({
      eventType: "admin_change",
      resourceKey: "toggle_admin",
      metadata: { userId, isAdmin },
    })

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUserActive(
  userId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    await logAdminActivity({
      eventType: "admin_change",
      resourceKey: "toggle_active",
      metadata: { userId, isActive },
    })

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUserDepartmentPermission(
  userId: string,
  token: DepartmentPermissionKey,
  enabled: boolean,
): Promise<{ success: boolean; error?: string; department?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    if (token === "Admin") {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: enabled, updated_at: new Date().toISOString() })
        .eq("id", userId)
      if (error) return { success: false, error: error.message }
      await logAdminActivity({
        eventType: "admin_change",
        resourceKey: "department_admin",
        metadata: { userId, enabled },
      })
      revalidatePath("/admin")
      return { success: true }
    }

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("department")
      .eq("id", userId)
      .single()

    if (fetchError || !profile) {
      return { success: false, error: fetchError?.message || "Profile not found" }
    }

    const department = setDepartmentToken(profile.department, token, enabled)
    const { error } = await supabase
      .from("profiles")
      .update({ department, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    await logAdminActivity({
      eventType: "admin_change",
      resourceKey: `department_${token.toLowerCase().replace(/\s+/g, "_")}`,
      metadata: { userId, enabled, department },
    })

    revalidatePath("/admin")
    return { success: true, department }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUserCardPermission(
  userId: string,
  cardKey: CardPermissionKey,
  enabled: boolean,
): Promise<{ success: boolean; error?: string; card_permissions?: Record<string, boolean> }> {
  try {
    const supabase = await createServerSupabaseClient()
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("card_permissions")
      .eq("id", userId)
      .single()

    if (fetchError || !profile) {
      return { success: false, error: fetchError?.message || "Profile not found" }
    }

    const card_permissions = buildCardPermissionsPatch(
      { id: userId, card_permissions: profile.card_permissions || {} } as Profile,
      cardKey,
      enabled,
    )

    const { error } = await supabase
      .from("profiles")
      .update({ card_permissions, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    await logAdminActivity({
      eventType: "admin_change",
      resourceKey: cardKey,
      metadata: { userId, enabled },
    })

    revalidatePath("/admin")
    return { success: true, card_permissions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUsers(): Promise<{ users: any[]; error: string | null }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("profiles").select("*").order("full_name", { ascending: true })

    if (error) {
      return { users: [], error: error.message }
    }

    return { users: data, error: null }
  } catch (error: any) {
    return { users: [], error: error.message }
  }
}

export async function getActivityEvents(limit = 200): Promise<{
  events: ActivityEventRow[]
  error: string | null
}> {
  try {
    const currentUserIsAdmin = await checkIsAdmin()
    if (!currentUserIsAdmin) {
      return { events: [], error: "Unauthorized" }
    }

    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from("activity_events")
      .select("id, user_id, event_type, resource_key, resource_label, resource_path, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return { events: [], error: error.message }
    }

    return { events: (data || []) as ActivityEventRow[], error: null }
  } catch (error: any) {
    return { events: [], error: error.message }
  }
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return false
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin, is_active")
      .eq("id", user.id)
      .single()

    if (error) {
      return false
    }

    if (data?.is_active === false) {
      return false
    }

    return data?.is_admin === true
  } catch {
    return false
  }
}

export interface ActivityEventRow {
  id: string
  user_id: string
  event_type: string
  resource_key?: string | null
  resource_label?: string | null
  resource_path?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface AdminEmployeeRow extends Profile {
  email?: string
  loginCount: number
  lastLogin: Date | null
  cardActivityCount: number
  lastActivity: Date | null
  usageStatus: "Active" | "Inactive" | "Unused"
  usageStatusColor: string
}

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

async function logAdminActivity(params: {
  eventType: string
  resourceKey: string
  resourceLabel?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const service = getServiceRoleClient()
    await service.from("activity_events").insert({
      user_id: user.id,
      event_type: params.eventType,
      resource_key: params.resourceKey,
      resource_label: params.resourceLabel || null,
      metadata: params.metadata || {},
    })
  } catch {
    // non-blocking
  }
}

export type { LunchOrderActivityRow } from "@/lib/lunch-order-admin"

export async function getAdminEmployeeData(): Promise<{
  employees: AdminEmployeeRow[]
  activityEvents: ActivityEventRow[]
  lunchOrderActivity: LunchOrderActivityRow[]
  lunchOrderError: string | null
  error: string | null
}> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) {
      return {
        employees: [],
        activityEvents: [],
        lunchOrderActivity: [],
        lunchOrderError: null,
        error: "Unauthorized",
      }
    }

    const supabase = getServiceRoleClient()
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name, department, position, is_admin, is_active, card_permissions, updated_at")
      .order("full_name")

    if (profilesError) {
      return {
        employees: [],
        activityEvents: [],
        lunchOrderActivity: [],
        lunchOrderError: null,
        error: profilesError.message,
      }
    }

    const currentDate = new Date()
    const monthToDate = getHongKongMonthToDateRange(currentDate)

    const [
      { data: loginHistory },
      { data: monthActivity },
      { data: authUsers },
      { data: activityEvents, error: activityError },
      lunchResult,
    ] = await Promise.all([
      supabase
        .from("login_history")
        .select("user_id, login_timestamp, login_success")
        .gte("login_timestamp", monthToDate.from)
        .lt("login_timestamp", monthToDate.to)
        .eq("login_success", true)
        .limit(2000),
      supabase
        .from("activity_events")
        .select("user_id, created_at, event_type, resource_path")
        .gte("created_at", monthToDate.from)
        .lt("created_at", monthToDate.to)
        .in("event_type", ["card_click", "portal_open", "page_view"])
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase.auth.admin.listUsers({ page: 1, perPage: 2000 }),
      supabase
        .from("activity_events")
        .select("id, user_id, event_type, resource_key, resource_label, resource_path, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      fetchLunchOrderActivity(7, 300),
    ])

    const emailById = new Map((authUsers?.users || []).map((user) => [user.id, user.email || ""]))
    const lastSignInById = new Map(
      (authUsers?.users || []).map((user) => [
        user.id,
        user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
      ]),
    )
    const lunchOrderActivity = lunchResult.rows
    const lunchOrderError = lunchResult.error
    const lunchEngagement = new Map<string, { count: number; lastAt: Date }>()
    for (const row of lunchOrderActivity) {
      const stamp = new Date(row.timestamp)
      const add = (memberId: string | null) => {
        if (!memberId) return
        const current = lunchEngagement.get(memberId)
        if (!current) {
          lunchEngagement.set(memberId, { count: 1, lastAt: stamp })
          return
        }
        current.count += 1
        if (stamp > current.lastAt) current.lastAt = stamp
      }
      add(row.memberId)
      if (row.operatorMemberId && row.operatorMemberId !== row.memberId) {
        add(row.operatorMemberId)
      }
    }

    const loginsByUser = new Map<string, NonNullable<typeof loginHistory>[number][]>()
    for (const row of loginHistory || []) {
      const list = loginsByUser.get(row.user_id) || []
      list.push(row)
      loginsByUser.set(row.user_id, list)
    }
    const activitiesByUser = new Map<string, NonNullable<typeof monthActivity>[number][]>()
    for (const row of monthActivity || []) {
      const list = activitiesByUser.get(row.user_id) || []
      list.push(row)
      activitiesByUser.set(row.user_id, list)
    }

    const employees: AdminEmployeeRow[] = (profiles || []).map((profile) => {
      const userLogins = loginsByUser.get(profile.id) || []
      const loginCount = userLogins.length
      const lastHistoryLogin =
        userLogins.length > 0
          ? new Date(Math.max(...userLogins.map((l) => new Date(l.login_timestamp).getTime())))
          : null
      const lastLogin = lastSignInById.get(profile.id) || lastHistoryLogin

      const userActivities = activitiesByUser.get(profile.id) || []
      const email = emailById.get(profile.id) || ""
      const enteredCount = userActivities.filter(
        (a) =>
          a.event_type === "page_view" &&
          (a.resource_path === "/dashboard" || (a.resource_path || "").startsWith("/dashboard")),
      ).length
      const cardOps = userActivities.filter(
        (a) => a.event_type === "card_click" || a.event_type === "portal_open",
      )
      const lunchMemberId = resolveLunchMemberId(profile.full_name, email)
      const lunch = lunchMemberId ? lunchEngagement.get(lunchMemberId) : undefined
      const cardActivityCount = (lunch?.count || 0) + enteredCount
      const lastCardOp =
        cardOps.length > 0
          ? new Date(Math.max(...cardOps.map((a) => new Date(a.created_at).getTime())))
          : null
      const lastVisit =
        userActivities.length > 0
          ? new Date(Math.max(...userActivities.map((a) => new Date(a.created_at).getTime())))
          : null
      const lastActivityDates = [lastCardOp, lastVisit, lastLogin, lunch?.lastAt ?? null].filter(
        (d): d is Date => d !== null,
      )
      const lastActivity =
        lastActivityDates.length > 0
          ? new Date(Math.max(...lastActivityDates.map((d) => d.getTime())))
          : null

      const engagementDates = [lastLogin, lastActivity].filter((d): d is Date => d !== null)
      const lastEngagement =
        engagementDates.length > 0
          ? new Date(Math.max(...engagementDates.map((d) => d.getTime())))
          : null

      let usageStatus: AdminEmployeeRow["usageStatus"] = "Unused"
      let usageStatusColor = "text-red-600 bg-red-100"

      if (loginCount > 0 || cardActivityCount > 0) {
        const daysSinceEngagement = lastEngagement
          ? Math.floor((currentDate.getTime() - lastEngagement.getTime()) / (1000 * 60 * 60 * 24))
          : 0

        if (daysSinceEngagement <= 7) {
          usageStatus = "Active"
          usageStatusColor = "text-green-600 bg-green-100"
        } else {
          usageStatus = "Inactive"
          usageStatusColor = "text-yellow-600 bg-yellow-100"
        }
      }

      return {
        ...profile,
        email,
        loginCount,
        lastLogin,
        cardActivityCount,
        lastActivity,
        usageStatus,
        usageStatusColor,
        is_active: profile.is_active !== false,
        card_permissions: profile.card_permissions || {},
      }
    })

    if (activityError) {
      return {
        employees,
        activityEvents: [],
        lunchOrderActivity,
        lunchOrderError,
        error: activityError.message,
      }
    }

    return {
      employees,
      activityEvents: (activityEvents || []) as ActivityEventRow[],
      lunchOrderActivity,
      lunchOrderError,
      error: null,
    }
  } catch (error: any) {
    return {
      employees: [],
      activityEvents: [],
      lunchOrderActivity: [],
      lunchOrderError: null,
      error: error.message,
    }
  }
}
