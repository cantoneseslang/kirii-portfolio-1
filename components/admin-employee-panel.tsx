"use client"

import { Fragment, useMemo, useState, useTransition } from "react"
import { AdminPermissionSwitch } from "@/components/admin-permission-switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { resolveDisplayTitle } from "@/lib/display-title"
import {
  updateUserActive,
  updateUserCardPermission,
  updateUserDepartmentPermission,
  type ActivityEventRow,
  type AdminEmployeeRow,
} from "@/app/admin/actions"
import {
  CARD_PERMISSIONS,
  DEPARTMENT_PERMISSION_KEYS,
  getCardPermissionDefinition,
  hasDepartmentToken,
  resolveCardPermissionState,
  type CardPermissionKey,
  type DepartmentPermissionKey,
} from "@/lib/card-permissions"

interface AdminEmployeePanelProps {
  initialEmployees: AdminEmployeeRow[]
  initialActivityEvents: ActivityEventRow[]
  nameByUserId: Record<string, string>
}

function formatHongKongTime(date: Date | null): string {
  if (!date) return "Not logged in"
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
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
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
            prev.map((row) => {
              if (row.id !== employee.id) return row
              if (token === "Admin") return { ...row, is_admin: enabled }
              return { ...row, department: result.department ?? row.department }
            }),
          )
        }
        return result
      })
    })
  }

  const handleCardToggle = (employee: AdminEmployeeRow, cardKey: CardPermissionKey, enabled: boolean) => {
    startTransition(async () => {
      await runUpdate(`card-${employee.id}-${cardKey}`, async () => {
        const result = await updateUserCardPermission(employee.id, cardKey, enabled)
        if (result.success) {
          setEmployees((prev) =>
            prev.map((row) =>
              row.id === employee.id
                ? { ...row, card_permissions: result.card_permissions || row.card_permissions }
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
          <div className="text-sm">Recently Active</div>
        </div>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{summary.inactiveUsers}</div>
          <div className="text-sm">Inactive (7d+)</div>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="text-2xl font-bold">{summary.unusedUsers}</div>
          <div className="text-sm">Unused This Month</div>
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
                左のスイッチで社員の有効/無効、行を開いて部門・カード権限を即時変更できます。
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login (HK)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cards</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => {
                    const isExpanded = expandedUserId === employee.id
                    const accountEnabled = employee.is_active !== false
                    return (
                      <Fragment key={employee.id}>
                        <tr
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
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department || "—"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{employee.position || "—"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{employee.loginCount}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatHongKongTime(employee.lastLogin)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.usageStatusColor}`}>
                              {employee.usageStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              className="text-sm text-blue-600 hover:underline"
                              onClick={() => setExpandedUserId(isExpanded ? null : employee.id)}
                            >
                              {isExpanded ? "Close" : "Edit cards"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50">
                            <td colSpan={10} className="px-6 py-5">
                              <div className="space-y-6">
                                <div>
                                  <h4 className="text-sm font-semibold mb-3">Department Permissions</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {DEPARTMENT_PERMISSION_KEYS.map((token) => {
                                      const enabled =
                                        token === "Admin"
                                          ? employee.is_admin === true
                                          : hasDepartmentToken(employee.department, token)
                                      return (
                                        <label
                                          key={token}
                                          className="flex items-center justify-between gap-3 rounded border bg-white px-3 py-2 text-sm"
                                        >
                                          <span>{token}</span>
                                          <AdminPermissionSwitch
                                            checked={enabled}
                                            disabled={pendingKey === `dept-${employee.id}-${token}`}
                                            onCheckedChange={(checked) =>
                                              handleDepartmentToggle(employee, token, checked)
                                            }
                                          />
                                        </label>
                                      )
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold mb-3">Card Permissions</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {CARD_PERMISSIONS.map((card) => {
                                      const enabled = resolveCardPermissionState(employee, card.key)
                                      return (
                                        <label
                                          key={card.key}
                                          className="flex items-center justify-between gap-3 rounded border bg-white px-3 py-2"
                                        >
                                          <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">{card.label}</div>
                                            {card.labelZh && (
                                              <div className="text-xs text-gray-500 truncate">{card.labelZh}</div>
                                            )}
                                          </div>
                                          <AdminPermissionSwitch
                                            checked={enabled}
                                            disabled={pendingKey === `card-${employee.id}-${card.key}`}
                                            onCheckedChange={(checked) =>
                                              handleCardToggle(employee, card.key, checked)
                                            }
                                          />
                                        </label>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (HK)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Path</th>
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
