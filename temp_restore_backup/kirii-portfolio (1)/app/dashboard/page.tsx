"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { getProfile } from "@/utils/profile"
import type { Profile } from "@/types/profile"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const isBypass = searchParams.get("bypass") === "true"

  useEffect(() => {
    // ユーザーがロードされたらプロフィールを取得
    if (user && !isLoading) {
      loadProfile()
    } else if (isBypass) {
      // バイパスモードの場合はダミープロフィールを設定
      setProfile({
        id: "bypass-user",
        full_name: "Bypass User",
        department: "Development",
        position: "Tester",
      })
    }
  }, [user, isLoading, isBypass])

  const loadProfile = async () => {
    if (!user) return

    setIsLoadingProfile(true)
    setError(null)

    try {
      const profileData = await getProfile(user.id)

      if (profileData) {
        setProfile(profileData)
      } else {
        // プロフィールが取得できなくても、最低限の情報を設定
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || "User",
        } as Profile)
      }
    } catch (error: any) {
      console.error("Error in loadProfile:", error)
      setError(error.message || "Failed to load profile")

      // エラーが発生しても、最低限の情報を設定
      setProfile({
        id: user.id,
        full_name: user.user_metadata?.full_name || "User",
      } as Profile)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // 認証情報のロード中の表示
  if (isLoading && !isBypass) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading your dashboard...</h2>
            <p className="text-muted-foreground">Please wait a moment</p>
          </div>
        </div>
      </div>
    )
  }

  // ユーザーが認証されていない場合（バイパスモードを除く）
  if (!user && !isBypass) {
    return (
      <div className="container py-10">
        <Alert>
          <AlertDescription>
            You are not logged in. Please{" "}
            <a href="/" className="text-blue-600 hover:underline">
              sign in
            </a>{" "}
            to access the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text={`Welcome${profile?.full_name ? ` ${profile.full_name}` : ""} to your dashboard.`}
      />

      {isBypass && (
        <Alert className="mb-4">
          <AlertDescription>You are viewing this page in bypass mode. Authentication is disabled.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProfile ? (
              <p>Loading profile...</p>
            ) : profile ? (
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {profile.full_name || "Not set"}
                </p>
                <p>
                  <strong>Department:</strong> {profile.department || "Not set"}
                </p>
                <p>
                  <strong>Position:</strong> {profile.position || "Not set"}
                </p>
                <p>
                  <strong>Admin:</strong> {profile.is_admin ? "Yes" : "No"}
                </p>
              </div>
            ) : (
              <p>No profile information available.</p>
            )}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={() => logout()} variant="outline" className="w-full">
                Logout
              </Button>
              <Button onClick={() => (window.location.href = "/admin")} variant="outline" className="w-full">
                Admin Panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

