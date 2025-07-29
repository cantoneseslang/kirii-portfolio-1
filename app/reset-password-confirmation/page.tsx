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

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLのハッシュ部分からトークンを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const tokenType = hashParams.get('token_type')
        const type = hashParams.get('type')

        if (accessToken && refreshToken && type === 'recovery') {
          // Supabaseセッションを設定
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Session setup error:', error)
            setError("Invalid or expired recovery link. Please request a new password reset.")
          } else {
            console.log('Session set successfully:', data)
            setIsValidSession(true)
            // URLからハッシュを削除
            window.history.replaceState(null, '', window.location.pathname)
          }
        } else {
          // 既存のセッションをチェック
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          if (sessionError || !sessionData?.session) {
            setError("Invalid or expired recovery link. Please request a new password reset.")
          } else {
            setIsValidSession(true)
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError("Error processing recovery link. Please try again.")
      }
    }
    
    handleAuthCallback()
  }, [])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

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
      // Update the user's password
      const { data, error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      setSuccess("Password successfully reset. You will be redirected to the login page shortly.")
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error: any) {
      console.error("Password update error:", error)
      setError(`Error updating password: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
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
                <div className="text-center">
                  <p>Processing recovery link...</p>
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
