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
            setError(`Failed to set up session: ${error.message}`)
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
            setError("Error occurred while checking session.")
          } else if (sessionData?.session?.user) {
            console.log('Valid existing session found')
            setIsValidSession(true)
          } else {
            console.log('No valid session found')
            setError("Invalid or expired reset link. Please request a new password reset.")
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError("Error processing recovery link. Please try again.")
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
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      // 現在のセッションを再確認
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !sessionData?.session) {
        setError("Session is invalid. Please request a new password reset.")
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
      setSuccess("Password successfully reset. You will be redirected to the login page shortly.")
      
      // ログインページにリダイレクト
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (error: any) {
      console.error("Password update error:", error)
      setError(`Error updating password: ${error.message}`)
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
                  <p>Processing recovery link...</p>
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
              <h2 className="text-xl font-semibold text-center">Set New Password</h2>
            </CardHeader>
            <CardContent>
              {isValidSession ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
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
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                      {isLoading ? "Updating..." : "Reset Password"}
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    <a href="/" className="text-blue-600 hover:underline">
                      Back to Login
                    </a>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-red-600">No valid recovery session found.</p>
                  <Button 
                    onClick={() => router.push("/forgot-password")}
                    variant="outline"
                    className="w-full"
                  >
                    Request New Password Reset
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
