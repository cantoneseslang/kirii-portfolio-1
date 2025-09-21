"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, Filter } from "lucide-react"

interface LoginHistory {
  id: string
  user_id: string
  login_timestamp: string
  ip_address: string
  user_agent: string
  login_success: boolean
  error_message: string | null
  page_accessed: string
  user_profile?: {
    full_name: string
    email: string
    department: string
  }
}

export function LoginHistoryDashboard() {
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, success, failed
  const [timeRange, setTimeRange] = useState("30") // 7, 30, 90 days
  const [selectedUser, setSelectedUser] = useState("all")
  const [users, setUsers] = useState<Array<{id: string, full_name: string, email: string}>>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnshbcvrrzlumfomniim.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M'
  )

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // ログイン履歴を取得
  const fetchLoginHistory = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('login_history')
        .select(`
          *,
          user_profile:profiles(full_name, email, department)
        `)
        .order('login_timestamp', { ascending: false })

      // 時間範囲フィルター
      if (timeRange !== "all") {
        const daysAgo = new Date()
        daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange))
        query = query.gte('login_timestamp', daysAgo.toISOString())
      }

      // 成功/失敗フィルター
      if (filter === "success") {
        query = query.eq('login_success', true)
      } else if (filter === "failed") {
        query = query.eq('login_success', false)
      }

      // ユーザーフィルター
      if (selectedUser !== "all") {
        query = query.eq('user_id', selectedUser)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      setLoginHistory(data || [])
    } catch (error) {
      console.error('Error fetching login history:', error)
    } finally {
      setLoading(false)
    }
  }

  // 統計データを計算
  const getStats = () => {
    const total = loginHistory.length
    const successful = loginHistory.filter(h => h.login_success).length
    const failed = total - successful
    const uniqueUsers = new Set(loginHistory.map(h => h.user_id)).size

    return { total, successful, failed, uniqueUsers }
  }

  // CSVエクスポート
  const exportToCSV = () => {
    const headers = ['User', 'Email', 'Department', 'Login Time', 'IP Address', 'Success', 'Error Message']
    const csvContent = [
      headers.join(','),
      ...loginHistory.map(h => [
        h.user_profile?.full_name || 'Unknown',
        h.user_profile?.email || 'Unknown',
        h.user_profile?.department || 'Unknown',
        new Date(h.login_timestamp).toLocaleString(),
        h.ip_address,
        h.login_success ? 'Yes' : 'No',
        h.error_message || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `login_history_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchLoginHistory()
  }, [filter, timeRange, selectedUser])

  const stats = getStats()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">ログイン履歴</h2>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          CSVエクスポート
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ログイン数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功ログイン</CardTitle>
            <Badge variant="default" className="bg-green-500">成功</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失敗ログイン</CardTitle>
            <Badge variant="destructive">失敗</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブユーザー</CardTitle>
            <Badge variant="secondary">ユーザー</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">ステータス:</label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="success">成功のみ</SelectItem>
                  <SelectItem value="failed">失敗のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">期間:</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">過去7日</SelectItem>
                  <SelectItem value="30">過去30日</SelectItem>
                  <SelectItem value="90">過去90日</SelectItem>
                  <SelectItem value="all">すべて</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">ユーザー:</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのユーザー</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ログイン履歴テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>ログイン履歴詳細</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ユーザー</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>ログイン時刻</TableHead>
                  <TableHead>IPアドレス</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>エラーメッセージ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {history.user_profile?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {history.user_profile?.email || 'Unknown'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{history.user_profile?.department || 'Unknown'}</TableCell>
                    <TableCell>
                      {new Date(history.login_timestamp).toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell>{history.ip_address}</TableCell>
                    <TableCell>
                      <Badge variant={history.login_success ? "default" : "destructive"}>
                        {history.login_success ? "成功" : "失敗"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {history.error_message || '-'}
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


