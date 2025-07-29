"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"

export default function ResetPasswordConfirmation() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Starting password reset callback handling...")
        
        // クライアントサイドでのみURLパラメータを処理
        let accessToken: string | null = null
        let refreshToken: string | null = null
        let type: string | null = null
        
        // URLSearchParamsを使用してクエリパラメータを取得
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          accessToken = urlParams.get('access_token')
          refreshToken = urlParams.get('refresh_token')
          type = urlParams.get('type')
          
          // ハッシュからも取得を試行
          if (!accessToken && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            accessToken = hashParams.get('access_token')
            refreshToken = hashParams.get('refresh_token')
            type = hashParams.get('type')
          }
        }

        console.log("Tokens found:", { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          type 
        })

        if (accessToken && refreshToken && type === 'recovery') {
          console.log("Setting up session with recovery tokens...")
          
          // Supabaseセッションを設定
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Session setup error:', error)
            setError(`セッションの設定に失敗しました: ${error.message}`)
          } else {
            console.log('Session set successfully:', data)
            setIsValidSession(true)
            
            // URLをクリーンアップ
            if (typeof window !== 'undefined') {
              const cleanUrl = window.location.pathname
              window.history.replaceState(null, '', cleanUrl)
            }
          }
        } else {
          console.log("No recovery tokens found, checking existing session...")
          
          // 既存のセッションをチェック
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session check error:', sessionError)
            setError("セッションの確認中にエラーが発生しました。")
          } else if (sessionData?.session?.user) {
            console.log('Valid existing session found')
            setIsValidSession(true)
          } else {
            console.log('No valid session found')
            setError("無効または期限切れのリセットリンクです。新しいパスワードリセットを要求してください。")
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError("リカバリーリンクの処理中にエラーが発生しました。もう一度お試しください。")
      } finally {
        setIsInitializing(false)
      }
    }
    
    handleAuthCallback()
  }, [])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    console.log("Starting password update...")

    // Input validation
    if (password.length < 8) {
      setError("パスワードは8文字以上である必要があります")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      setIsLoading(false)
      return
    }

    try {
      // 現在のセッションを再確認
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !sessionData?.session) {
        setError("セッションが無効です。新しいパスワードリセットを要求してください。")
        setIsLoading(false)
        return
      }

      console.log("Updating password for user:", sessionData.session.user.id)

      // パスワードを更新
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.error("Password update error:", error)
        throw error
      }

      console.log("Password updated successfully:", data)
      setSuccess("パスワードが正常にリセットされました。まもなくログインページにリダイレクトされます。")
      
      // ログインページにリダイレクト
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (error: any) {
      console.error("Password update error:", error)
      setError(`パスワードの更新中にエラーが発生しました: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <div className="text-center">
                  <p>リカバリーリンクを処理中...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-xl font-semibold text-center">新しいパスワードを設定</h2>
            </CardHeader>
            <CardContent>
              {isValidSession ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">新しいパスワード</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "更新中..." : "パスワードをリセット"}
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    <a href="/" className="text-blue-600 hover:underline">
                      ログインページに戻る
                    </a>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-red-600">有効なリカバリーセッションが見つかりません。</p>
                  <Button 
                    onClick={() => router.push("/forgot-password")}
                    variant="outline"
                    className="w-full"
                  >
                    新しいパスワードリセットを要求
                  </Button>
                </div>
              )}
            </CardContent>

            {error && (
              <CardFooter className="flex-col items-start">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </CardFooter>
            )}

            {success && (
              <CardFooter className="flex-col items-start">
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
