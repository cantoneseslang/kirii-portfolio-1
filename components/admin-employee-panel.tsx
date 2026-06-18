"use client"

import { useMemo, useState, useTransition } from "react"
import { AdminPermissionSwitch } from "@/components/admin-permission-switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { resolveDisplayTitle } from "@/lib/display-title"
import {
  updateUserActive,
  updateUserDepartmentPermission,
  type ActivityEventRow,
  type AdminEmployeeRow,
} from "@/app/admin/actions"
import {
  getCardPermissionDefinition,
  hasDepartmentToken,
  type CardPermissionKey,
  type DepartmentPermissionKey,
} from "@/lib/card-permissions"

const DEPARTMENT_SWITCH_KEYS = [
  "All Employees",
  "Sales",
  "Purchasing",
  "Factory",
] as const satisfies readonly DepartmentPermissionKey[]

const SCROLLABLE_TABLE_WRAPPER =
  "max-h-[calc(100vh-20rem)] min-h-[24rem] overflow-auto overscroll-contain"

interface AdminEmployeePanelProps {
  initialEmployees: AdminEmployeeRow[]
  initialActivityEvents: ActivityEventRow[]
  nameByUserId: Record<string, string>
}

function formatHongKongTime(date: Date | null, emptyLabel = "Not logged in"): string {
  if (!date) return emptyLabel
  const hongKongTime = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  return hongKongTime.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function formatEventTime(iso: string): string {
  const date = new Date(iso)
  return formatHongKongTime(date)
}

export function AdminEmployeePanel({
  initialEmployees,
  initialActivityEvents,
  nameByUserId,
}: AdminEmployeePanelProps) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [activityEvents] = useState(initialActivityEvents)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const { toast } = useToast()

  const summary = useMemo(() => {
    const totalUsers = employees.length
    const enabledUsers = employees.filter((e) => e.is_active !== false).length
    const activeUsers = employees.filter((e) => e.usageStatus === "Active").length
    const inactiveUsers = employees.filter((e) => e.usageStatus === "Inactive").length
    const unusedUsers = employees.filter((e) => e.usageStatus === "Unused").length
    return { totalUsers, enabledUsers, activeUsers, inactiveUsers, unusedUsers }
  }, [employees])

  const runUpdate = async (key: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setPendingKey(key)
    try {
      const result = await fn()
      if (!result.success) {
        toast({
          title: "更新失敗",
          description: result.error || "変更を保存できませんでした",
          variant: "destructive",
        })
      }
    } finally {
      setPendingKey(null)
    }
  }

  const handleActiveToggle = (employee: AdminEmployeeRow, enabled: boolean) => {
    startTransition(async () => {
      await runUpdate(`active-${employee.id}`, async () => {
        const result = await updateUserActive(employee.id, enabled)
        if (result.success) {
          setEmployees((prev) =>
            prev.map((row) => (row.id === employee.id ? { ...row, is_active: enabled } : row)),
          )
          toast({
            title: enabled ? "社員を有効化しました" : "社員を無効化しました",
            description: employee.full_name || employee.email,
          })
        }
        return result
      })
    })
  }

  const handleDepartmentToggle = (
    employee: AdminEmployeeRow,
    token: DepartmentPermissionKey,
    enabled: boolean,
  ) => {
    startTransition(async () => {
      await runUpdate(`dept-${employee.id}-${token}`, async () => {
        const result = await updateUserDepartmentPermission(employee.id, token, enabled)
        if (result.success) {
          setEmployees((prev) =>
            prev.map((row) =>
              row.id === employee.id
                ? { ...row, department: result.department ?? row.department }
                : row,
            ),
          )
        }
        return result
      })
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{summary.totalUsers}</div>
          <div className="text-sm">Total Users</div>
        </div>
        <div className="bg-slate-100 border border-slate-400 text-slate-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{summary.enabledUsers}</div>
          <div className="text-sm">Account Enabled</div>
        </div>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{summary.activeUsers}</div>
          <div className="text-sm">Active (login or card, 7d)</div>
        </div>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{summary.inactiveUsers}</div>
          <div className="text-sm">Inactive (7d+, this month)</div>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{summary.unusedUsers}</div>
          <div className="text-sm">No login or card use</div>
        </div>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">Employee Access Control</h3>
              <p className="text-sm text-gray-600 mt-1">
                左の Active で有効/無効、Department 列のスイッチで部門権限を変更できます（緑=ON、赤=OFF）。
              </p>
            </div>
            <div className={SCROLLABLE_TABLE_WRAPPER}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Display Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Login Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Last Login (HK)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Card Activity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Last Activity (HK)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Usage</th>
                    {DEPARTMENT_SWITCH_KEYS.map((token) => (
                      <th
                        key={token}
                        className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap bg-gray-50"
                      >
                        {token}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => {
                    const accountEnabled = employee.is_active !== false
                    return (
                      <tr
                        key={employee.id}
                        className={!accountEnabled ? "bg-red-50" : employee.usageStatus === "Inactive" ? "bg-yellow-50" : ""}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <AdminPermissionSwitch
                            checked={accountEnabled}
                            disabled={pendingKey === `active-${employee.id}`}
                            onCheckedChange={(checked) => handleActiveToggle(employee, checked)}
                            aria-label={`Toggle active for ${employee.full_name}`}
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-[#02315a]">
                          {resolveDisplayTitle(employee)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.full_name}
                          {!accountEnabled && (
                            <span className="ml-2 text-xs text-red-600 font-semibold">DISABLED</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{employee.email || "N/A"}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{employee.position || "—"}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{employee.loginCount}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatHongKongTime(employee.lastLogin)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.cardActivityCount}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatHongKongTime(employee.lastActivity, "No activity")}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.usageStatusColor}`}>
                            {employee.usageStatus}
                          </span>
                        </td>
                        {DEPARTMENT_SWITCH_KEYS.map((token) => {
                          const enabled = hasDepartmentToken(employee.department, token)
                          return (
                            <td key={`${employee.id}-${token}`} className="px-3 py-4 whitespace-nowrap text-center">
                              <AdminPermissionSwitch
                                checked={enabled}
                                disabled={pendingKey === `dept-${employee.id}-${token}`}
                                onCheckedChange={(checked) =>
                                  handleDepartmentToggle(employee, token, checked)
                                }
                                aria-label={`${token} for ${employee.full_name}`}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">Activity Monitor</h3>
              <p className="text-sm text-gray-600 mt-1">
                社員がポートフォリオ内のどこへアクセスし、何をしたかを記録します。
              </p>
            </div>
            <div className={SCROLLABLE_TABLE_WRAPPER}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Time (HK)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Resource</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Path</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        まだアクティビティは記録されていません。カード操作やページ閲覧後にここへ表示されます。
                      </td>
                    </tr>
                  ) : (
                    activityEvents.map((event) => {
                      const cardDef = event.resource_key
                        ? getCardPermissionDefinition(event.resource_key as CardPermissionKey)
                        : undefined
                      return (
                        <tr key={event.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatEventTime(event.created_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {nameByUserId[event.user_id] || event.user_id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{event.event_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {event.resource_label || cardDef?.label || event.resource_key || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{event.resource_path || "—"}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
