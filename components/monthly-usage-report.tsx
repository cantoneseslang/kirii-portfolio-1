"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, AlertTriangle, TrendingUp, TrendingDown, Users, Activity } from "lucide-react"

interface UserUsageData {
  user_id: string
  full_name: string
  email: string
  department: string
  position: string
  total_logins: number
  successful_logins: number
  failed_logins: number
  last_login: string | null
  first_login: string | null
  active_days: number
  login_frequency: number // 平均日間ログイン回数
  status: 'active' | 'inactive' | 'very_inactive'
}

interface DepartmentStats {
  department: string
  total_users: number
  active_users: number
  inactive_users: number
  avg_logins_per_user: number
  total_logins: number
}

export function MonthlyUsageReport() {
  const [usageData, setUsageData] = useState<UserUsageData[]>([])
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [filter, setFilter] = useState("all") // all, active, inactive, very_inactive

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnshbcvrrzlumfomniim.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M'
  )

  // 月間使用状況データを取得
  const fetchMonthlyUsageData = async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)

      // 全ユーザーのプロフィールを取得
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, department, position')
        .order('full_name')

      if (profilesError) throw profilesError

      // 各ユーザーのログイン履歴を取得
      const usageDataPromises = profiles.map(async (profile) => {
        const { data: loginHistory, error: loginError } = await supabase
          .from('login_history')
          .select('*')
          .eq('user_id', profile.id)
          .gte('login_timestamp', startDate.toISOString())
          .lte('login_timestamp', endDate.toISOString())
          .order('login_timestamp', { ascending: false })

        if (loginError) {
          console.error(`Error fetching login history for ${profile.full_name}:`, loginError)
          return null
        }

        const totalLogins = loginHistory?.length || 0
        const successfulLogins = loginHistory?.filter(h => h.login_success).length || 0
        const failedLogins = totalLogins - successfulLogins
        const lastLogin = loginHistory?.[0]?.login_timestamp || null
        const firstLogin = loginHistory?.[loginHistory.length - 1]?.login_timestamp || null
        const activeDays = new Set(loginHistory?.map(h => 
          new Date(h.login_timestamp).toDateString()
        )).size

        // 月の日数を計算
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
        const loginFrequency = totalLogins / daysInMonth

        // アクティビティステータスを判定
        let status: 'active' | 'inactive' | 'very_inactive'
        if (totalLogins >= 10) {
          status = 'active'
        } else if (totalLogins >= 1) {
          status = 'inactive'
        } else {
          status = 'very_inactive'
        }

        return {
          user_id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          department: profile.department,
          position: profile.position,
          total_logins: totalLogins,
          successful_logins: successfulLogins,
          failed_logins: failedLogins,
          last_login: lastLogin,
          first_login: firstLogin,
          active_days,
          login_frequency: Math.round(loginFrequency * 100) / 100,
          status
        }
      })

      const userData = (await Promise.all(usageDataPromises)).filter(Boolean) as UserUsageData[]
      setUsageData(userData)

      // 部門別統計を計算
      const deptStats = calculateDepartmentStats(userData)
      setDepartmentStats(deptStats)

    } catch (error) {
      console.error('Error fetching monthly usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 部門別統計を計算
  const calculateDepartmentStats = (data: UserUsageData[]): DepartmentStats[] => {
    const deptMap = new Map<string, DepartmentStats>()

    data.forEach(user => {
      if (!deptMap.has(user.department)) {
        deptMap.set(user.department, {
          department: user.department,
          total_users: 0,
          active_users: 0,
          inactive_users: 0,
          avg_logins_per_user: 0,
          total_logins: 0
        })
      }

      const dept = deptMap.get(user.department)!
      dept.total_users++
      dept.total_logins += user.total_logins

      if (user.status === 'active') {
        dept.active_users++
      } else {
        dept.inactive_users++
      }
    })

    // 平均を計算
    deptMap.forEach(dept => {
      dept.avg_logins_per_user = Math.round(dept.total_logins / dept.total_users * 100) / 100
    })

    return Array.from(deptMap.values()).sort((a, b) => b.total_logins - a.total_logins)
  }

  // CSVエクスポート
  const exportToCSV = () => {
    const headers = [
      'ユーザー名', 'メールアドレス', '部門', '役職', 
      '総ログイン数', '成功ログイン', '失敗ログイン', 
      'アクティブ日数', '平均日間ログイン数', '最終ログイン', 'ステータス'
    ]
    
    const csvContent = [
      headers.join(','),
      ...usageData
        .filter(user => {
          if (filter === "all") return true
          return user.status === filter
        })
        .map(user => [
          user.full_name,
          user.email,
          user.department,
          user.position,
          user.total_logins,
          user.successful_logins,
          user.failed_logins,
          user.active_days,
          user.login_frequency,
          user.last_login ? new Date(user.last_login).toLocaleDateString('ja-JP') : 'なし',
          user.status === 'active' ? 'アクティブ' : user.status === 'inactive' ? '非アクティブ' : '非常に非アクティブ'
        ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monthly_usage_report_${selectedMonth}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // フィルタリングされたデータ
  const filteredData = usageData.filter(user => {
    if (filter === "all") return true
    return user.status === filter
  })

  // 統計情報
  const totalUsers = usageData.length
  const activeUsers = usageData.filter(u => u.status === 'active').length
  const inactiveUsers = usageData.filter(u => u.status === 'inactive').length
  const veryInactiveUsers = usageData.filter(u => u.status === 'very_inactive').length
  const totalLogins = usageData.reduce((sum, user) => sum + user.total_logins, 0)

  useEffect(() => {
    fetchMonthlyUsageData()
  }, [selectedMonth])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">月間使用状況レポート</h2>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          CSVエクスポート
        </Button>
      </div>

      {/* 月選択とフィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            レポート設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">対象月:</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date()
                    date.setMonth(date.getMonth() - i)
                    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
                    return { value, label }
                  }).map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">ステータス:</label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのユーザー</SelectItem>
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="inactive">非アクティブ</SelectItem>
                  <SelectItem value="very_inactive">非常に非アクティブ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 全体統計 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブユーザー</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%の利用率
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">非アクティブユーザー</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inactiveUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">非常に非アクティブ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{veryInactiveUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ログイン数</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalLogins}</div>
          </CardContent>
        </Card>
      </div>

      {/* 部門別統計 */}
      <Card>
        <CardHeader>
          <CardTitle>部門別使用状況</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部門</TableHead>
                <TableHead>総ユーザー数</TableHead>
                <TableHead>アクティブユーザー</TableHead>
                <TableHead>非アクティブユーザー</TableHead>
                <TableHead>総ログイン数</TableHead>
                <TableHead>平均ログイン数/ユーザー</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentStats.map((dept) => (
                <TableRow key={dept.department}>
                  <TableCell className="font-medium">{dept.department}</TableCell>
                  <TableCell>{dept.total_users}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-500">
                      {dept.active_users}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {dept.inactive_users}
                    </Badge>
                  </TableCell>
                  <TableCell>{dept.total_logins}</TableCell>
                  <TableCell>{dept.avg_logins_per_user}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ユーザー詳細テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>ユーザー別使用状況詳細</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ユーザー名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>総ログイン数</TableHead>
                  <TableHead>アクティブ日数</TableHead>
                  <TableHead>平均日間ログイン数</TableHead>
                  <TableHead>最終ログイン</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.position}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.total_logins}</TableCell>
                    <TableCell>{user.active_days}</TableCell>
                    <TableCell>{user.login_frequency}</TableCell>
                    <TableCell>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('ja-JP')
                        : 'なし'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          user.status === 'active' ? 'default' :
                          user.status === 'inactive' ? 'secondary' : 'destructive'
                        }
                        className={
                          user.status === 'active' ? 'bg-green-500' :
                          user.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
                        }
                      >
                        {user.status === 'active' ? 'アクティブ' :
                         user.status === 'inactive' ? '非アクティブ' : '非常に非アクティブ'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
