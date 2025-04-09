"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getProfile } from "@/utils/profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AdminStatusDebugger() {
  const { user, refreshUserData } = useAuth()
  const [debugInfo, setDebugInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 管理者情報を直接Supabaseからロードして表示
  const loadDirectProfileInfo = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // utils/profile.tsのgetProfile関数を使用
      const profileData = await getProfile(user.id)
      
      setDebugInfo({
        userId: user.id,
        profileFound: !!profileData,
        isAdmin: profileData?.is_admin,
        rawProfileData: profileData
      })
    } catch (err) {
      console.error("デバッグツールエラー:", err)
      setError(err.message || "プロファイル情報の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  // Supabaseとの接続を更新して最新データを再取得
  const refreshConnection = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await refreshUserData()
      await loadDirectProfileInfo()
    } catch (err) {
      console.error("更新エラー:", err)
      setError(err.message || "接続更新に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>管理者ステータスデバッガー</CardTitle>
        </CardHeader>
        <CardContent>
          <p>ログインしていません。このツールを使用するにはログインしてください。</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>管理者ステータスデバッガー</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={loadDirectProfileInfo} disabled={loading}>
              プロファイル情報を直接取得
            </Button>
            <Button onClick={refreshConnection} disabled={loading} variant="outline">
              接続更新&amp;データ再取得
            </Button>
          </div>
          
          {loading && <p>読み込み中...</p>}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {debugInfo && (
            <div className="border p-4 rounded bg-gray-50 space-y-2 text-sm">
              <p><strong>ユーザーID:</strong> {debugInfo.userId}</p>
              <p><strong>プロファイル検出:</strong> {debugInfo.profileFound ? "あり" : "なし"}</p>
              <p><strong>管理者権限:</strong> {debugInfo.isAdmin === true ? "あり (true)" : 
                                            debugInfo.isAdmin === false ? "なし (false)" : "未設定 (null)"}</p>
              
              <details>
                <summary className="cursor-pointer font-semibold">詳細情報</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-60">
                  {JSON.stringify(debugInfo.rawProfileData, null, 2)}
                </pre>
              </details>
            </div>
          )}
          
          <div className="text-sm text-gray-500 mt-4">
            <p>
              このツールはSupabaseとの同期問題のデバッグに使用できます。「接続更新&amp;データ再取得」ボタンを
              クリックすると、Supabaseからの最新データを強制的に再読み込みします。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
