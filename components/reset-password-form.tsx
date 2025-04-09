"use client"

import { useState } from "react"
import type React from "react"
import { supabase } from "@/utils/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Input validation
    if (!email) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    try {
      // Send password reset email
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-confirmation`,
      })

      if (error) {
        throw error
      }

      setSuccess("Password reset email sent. Please check your inbox.")
      console.log("Password reset email sent to:", email)
    } catch (error: any) {
      console.error("Password reset error:", error)
      
      // Error message handling
      let errorMessage: string
      if (error.message.includes("User not found")) {
        errorMessage = "Email address not found. Please check your email address."
      } else {
        errorMessage = `Error: ${error.message}`
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h2 className="text-xl font-semibold text-center">Reset Password</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
          <div className="text-center text-sm">
            <a href="/" className="text-blue-600 hover:underline">
              Back to Login
            </a>
          </div>
        </form>
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
  )
}
