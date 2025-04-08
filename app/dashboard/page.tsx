"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { getProfile, createProfile } from "@/utils/profile"
import type { Profile } from "@/types/profile"
import { Button } from "@/components/ui/button"
import LunchOrderCard from "@/components/lunch-order-card"
import LunchOrderSheetCard from "@/components/lunch-order-sheet-card"
import SalesDashboardCard from "@/components/sales-dashboard-card"
import SupplierInfoCard from "@/components/supplier-info-card"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSignOut = async () => {
    try {
      await logout()
      
      // クッキーを完全に削除（supabaseセッション関連）
      document.cookie.split(";").forEach(c => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // 強制的にページをリロードして完全に新しいセッションでホームページに移動
      window.location.replace('/');
      
      // バックアップとして、タイムアウト後も強制的にリダイレクト
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 500);
    } catch (error) {
      console.error("Error signing out:", error)
      // エラー時も強制的にホームページへ
      window.location.replace('/');
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
      console.log("Loading profile for user:", user.id)
      const profileData = await getProfile(user.id)
      
      // プロフィールが見つからない場合は新しく作成
      if (!profileData) {
        console.log("Profile not found, attempting to create one")
        const result = await createProfile(user.id)
        
        if (result.success) {
          console.log("Profile created successfully, loading new profile")
          // 作成後に再度取得
          const newProfileData = await getProfile(user.id)
          if (newProfileData) {
            setProfile(newProfileData)
          } else {
            console.log("Could not load newly created profile, using basic info")
            setProfile({
              id: user.id,
              full_name: user.user_metadata?.full_name || "User",
            } as Profile)
          }
        } else {
          console.error("Failed to create profile:", result.error)
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || "User",
          } as Profile)
        }
      } else {
        console.log("Profile loaded successfully:", profileData)
        setProfile(profileData)
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
  if (isLoading) {
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

  // ユーザーが認証されていない場合
  if (!user) {
    return (
      <div className="container py-10">
        <Alert>
          <AlertDescription>
            You are not logged in. Please{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              sign in
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
        text={`Welcome${profile?.full_name ? ` ${profile.full_name}` : ""} to your dashboard.`}
      />

      <div className="grid gap-8 mt-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Department: All Employees</h3>
          {/* PCでは横並び、モバイルでは縦並びになるレスポンシブデザイン */}
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
