"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { getProfile, createProfile } from "@/utils/profile"
import type { Profile } from "@/types/profile"
import LunchOrderCard from "@/components/lunch-order-card"
import LunchOrderSheetCard from "@/components/lunch-order-sheet-card"
import SalesDashboardCard from "@/components/sales-dashboard-card"
import SupplierInfoCard from "@/components/supplier-info-card"
import DeepSeekChatCard from "@/components/deepseek-chat-card"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // セッションが存在しない場合、ホームページにリダイレクト
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Dashboard: No user found, redirecting to home page")
      router.push("/")
    }
  }, [isLoading, user, router])
  
  const handleSignOut = async () => {
    try {
      console.log("Dashboard: Sign out initiated")
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Dashboard: Error signing out:", error)
      // エラー時も強制的にホームページへ
      router.push("/")
    }
  }

  useEffect(() => {
    // ユーザーがロードされたらプロフィールを取得
    if (user && !isLoading) {
      loadProfile()
    }
  }, [user, isLoading])

  const loadProfile = async () => {
    if (!user) return

    setIsLoadingProfile(true)
    setError(null)

    try {
      // プロフィールの取得を試みる
      console.log("Dashboard: Loading profile for user:", user.id)
      const profileData = await getProfile(user.id)
      
      // プロフィールが見つからない場合は新しく作成
      if (!profileData) {
        console.log("Dashboard: Profile not found, attempting to create one")
        const result = await createProfile(user.id)
        
        if (result.success) {
          console.log("Dashboard: Profile created successfully")
          const newProfileData = await getProfile(user.id)
          setProfile(newProfileData || {
            id: user.id,
            full_name: user.user_metadata?.full_name || "ユーザー",
          } as Profile)
        } else {
          console.error("Dashboard: Failed to create profile:", result.error)
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || "ユーザー",
          } as Profile)
        }
      } else {
        console.log("Dashboard: Profile loaded successfully")
        setProfile(profileData)
      }
    } catch (error: any) {
      console.error("Dashboard: Error in loadProfile:", error)
      setError(error.message || "プロフィールの読み込みに失敗しました")
      setProfile({
        id: user.id,
        full_name: user.user_metadata?.full_name || "ユーザー",
      } as Profile)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // 認証情報のロード中の表示
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading dashboard...</h2>
            <p className="text-muted-foreground">Please wait</p>
          </div>
        </div>
      </div>
    )
  }

  // ユーザーが認証されていない場合
  if (!user) {
    return (
      <div className="container py-10">
        <Alert>
          <AlertDescription>
            You are not logged in. Please{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              login
            </Link>{" "}
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
        text={`Welcome, ${profile?.full_name || "User"}`}
      />

      <div className="grid gap-8 mt-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">AI Assistant</h3>
          <div className="flex flex-col gap-6 items-center">
            <DeepSeekChatCard />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Department: All Employees</h3>
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            <LunchOrderCard />
            <LunchOrderSheetCard />
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Department: Purchasing</h3>
          <div className="flex flex-col gap-6 items-start">
            <SupplierInfoCard />
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Department: Sales</h3>
          <div className="flex flex-col gap-6 items-start">
            <SalesDashboardCard />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
