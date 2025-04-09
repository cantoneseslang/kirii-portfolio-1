import { getUsers } from "./actions"
import { redirect } from "next/navigation"
import { checkIsAdmin } from "./actions"
import { AdminDashboard } from "@/components/admin-dashboard"

// ユーザータイプの定義
type User = {
  id: string
  email: string
  full_name: string
  english_name: string
  chinese_name: string
  sex: string
  department: string
}

export default async function AdminPage() {
  // 管理者権限をチェック
  const isAdmin = await checkIsAdmin()

  if (!isAdmin) {
    // 管理者でない場合はダッシュボードにリダイレクト
    redirect("/dashboard")
  }

  // ユーザーリストを取得
  const { users, error } = await getUsers()

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading users: {error}</p>
        </div>
      ) : (
        <AdminDashboard users={users} />
      )}
    </div>
  )
}
