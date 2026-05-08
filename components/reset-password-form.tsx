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
  const COUNTRY_CODE = "+852"
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [smsOtp, setSmsOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
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
      console.log("Sending password reset email...")

      // Send password reset email with proper options
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-confirmation`,
      })

      if (error) {
        throw error
      }

      setSuccess("If the account exists, a reset email was sent. Check inbox/spam within a few minutes.")
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

  const normalizePhoneInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "")
    // If pasted with country code, keep only local part in the input box.
    return digitsOnly.startsWith("852") ? digitsOnly.slice(3) : digitsOnly
  }

  const toE164Phone = (value: string) => `${COUNTRY_CODE}${normalizePhoneInput(value)}`

  const handleSendSmsOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedPhone = toE164Phone(phone)
    if (!normalizePhoneInput(phone)) {
      setError("Please enter your phone number.")
      return
    }

    setIsSendingOtp(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          shouldCreateUser: false,
        },
      })

      if (error) throw error

      setOtpSent(true)
      setSuccess("SMS verification code sent. Enter the code to continue.")
    } catch (err: any) {
      const message = String(err?.message || "")
      if (message.toLowerCase().includes("phone provider is not enabled")) {
        setError("SMS login is not enabled in Supabase Auth. Please enable Phone provider first.")
      } else if (
        message.toLowerCase().includes("invalid from number") ||
        message.includes("21212")
      ) {
        setError("SMS is temporarily unavailable due to provider configuration. Please use email reset for now.")
      } else {
        setError(`Failed to send SMS code: ${message}`)
      }
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifySmsOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedPhone = toE164Phone(phone)
    const normalizedOtp = smsOtp.trim()

    if (!normalizePhoneInput(phone)) {
      setError("Phone number format is invalid.")
      return
    }
    if (!normalizedOtp) {
      setError("Please enter the SMS verification code.")
      return
    }

    setIsVerifyingOtp(true)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: normalizedOtp,
        type: "sms",
      })

      if (error) throw error
      if (!data.session) {
        setError("Verification succeeded but no session was created. Please try again.")
        return
      }

      setSuccess("SMS login successful. Redirecting to dashboard...")
      setTimeout(() => {
        window.location.replace("/dashboard")
      }, 400)
    } catch (err: any) {
      setError(`Failed to verify SMS code: ${String(err?.message || "Unknown error")}`)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h2 className="text-xl font-semibold text-center">Recover Account</h2>
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
              {isLoading ? "Sending..." : "Send Email Reset Link"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use email reset to create a new password.
          </p>
        </form>

        <div className="my-5 h-px bg-gray-200" />

        <form onSubmit={handleSendSmsOtp} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="phone">Login with SMS (Phone)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="8-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">
              Enter your Hong Kong mobile number using 8 digits only.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isSendingOtp}>
            {isSendingOtp ? "Sending SMS..." : "Send SMS Code"}
          </Button>
        </form>

        {otpSent && (
          <form onSubmit={handleVerifySmsOtp} className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label htmlFor="smsOtp">SMS Verification Code</Label>
              <Input
                id="smsOtp"
                type="text"
                placeholder="123456"
                value={smsOtp}
                onChange={(e) => setSmsOtp(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isVerifyingOtp}>
              {isVerifyingOtp ? "Verifying..." : "Verify and Login"}
            </Button>
          </form>
        )}

        <div className="text-center text-sm mt-4">
          <div className="text-center text-sm">
            <a href="/" className="text-blue-600 hover:underline">
              Back to Login
            </a>
          </div>
        </div>
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
