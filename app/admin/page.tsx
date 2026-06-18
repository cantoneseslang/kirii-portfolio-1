import { redirect } from "next/navigation"
import Link from "next/link"
import { getAdminEmployeeData, checkIsAdmin } from "@/app/admin/actions"
import { AdminEmployeePanel } from "@/components/admin-employee-panel"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPage() {
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const { employees, activityEvents, error } = await getAdminEmployeeData()
  const nameByUserId = Object.fromEntries(
    employees.map((employee) => [employee.id, employee.full_name || employee.email || employee.id]),
  )

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        <div className="flex items-center">
          <strong>Employee Access & Activity Monitor</strong>
        </div>
        <div className="mt-2 text-sm">
          <p>Current Month: {currentYear}-{currentMonth.toString().padStart(2, "0")}</p>
          <p>Users Retrieved: {employees.length}</p>
          <p className="mt-1">左の Active スイッチで退職・停止、Edit cards でカード権限を即時変更できます。</p>
          <p className="mt-1">
            <Link href="/dashboard" className="underline">
              Back to Dashboard
            </Link>
          </p>
        </div>
      </div>

      <AdminEmployeePanel
        initialEmployees={employees}
        initialActivityEvents={activityEvents}
        nameByUserId={nameByUserId}
      />
    </div>
  )
}
