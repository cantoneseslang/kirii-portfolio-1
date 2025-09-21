"use client"

import type React from "react"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginFormWithHistory() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnshbcvrrzlumfomniim.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M'
  )

  // ログイン履歴を記録する関数
  const recordLoginHistory = async (userId: string, success: boolean, errorMessage?: string) => {
    try {
      const { data: ipData } = await fetch('https://api.ipify.org?format=json').then(res => res.json())
      
      await supabase.from('login_history').insert({
        user_id: userId,
        ip_address: ipData.ip,
        user_agent: navigator.userAgent,
        login_success: success,
        error_message: errorMessage || null,
        page_accessed: '/dashboard'
      })
    } catch (error) {
      console.error('Failed to record login history:', error)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Input validation
    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    try {
      // Debug log
      console.log("Login attempt with email:", email)

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // ログイン失敗を記録
        await recordLoginHistory('', false, error.message)
        throw error
      }

      // ログイン成功を記録
      if (data.user?.id) {
        await recordLoginHistory(data.user.id, true)
      }

      setSuccess("Login successful. Redirecting to dashboard...")
      console.log("Login successful for user:", data.user?.email)

      // Redirect - using setTimeout to ensure execution after the render cycle
      setTimeout(() => {
        // Build the complete URL for redirection
        const baseUrl = window.location.origin;
        const dashboardUrl = `${baseUrl}/dashboard`;
        console.log("Redirecting to:", dashboardUrl);
        
        // Force a full page redirect
        window.location.replace(dashboardUrl);
      }, 500);
    } catch (error: any) {
      console.error("Login error:", error)
      
      // Error message handling
      let errorMessage: string
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid login credentials. Please check your email and password."
      } else if (error.message.includes("database")) {
        errorMessage = "Database connection error. Please try again later."
      } else {
        errorMessage = `Login error: ${error.message}`
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center">Sign In</h2>
        <p className="text-muted-foreground text-center">
          Enter your credentials to access your account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


