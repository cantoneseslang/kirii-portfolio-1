"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Footer } from "@/components/footer"
import GanttChartWBSCard from "@/components/gantt-chart-wbs-card"
import QRScanCard from "@/components/qr-scan-card";
import KHK_AI_MONITOR_Card from "@/components/khk-ai-monitor-card";
import CompanyInfoCard from "@/components/company-info-card";
import ProductManualCard from "@/components/product-manual-card";
import PQFormCard from "@/components/pq-form-card";
import CertificateCard from "@/components/certificate-card";
import CollectPaymentCardWrapper from "@/components/collect-payment-card-wrapper";
import SalespersonCalendarCard from "@/components/salesperson-calendar-card";
import NotebookLMCard from "@/components/notebooklm-card";
import SteelPriceChartCard from "@/components/steel-price-chart-card";
import AluminumPriceChartCard from "@/components/aluminum-price-chart-card";
import FormMasterCard from "@/components/form-master-card";
import HkdRmbRateCard from "@/components/hkd-rmb-rate-card";
import NewCustomerSettingCard from "@/components/new-customer-setting-card";
import { isBlockedAuthEmail } from "@/lib/blocked-auth-emails";

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading, logout } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // バイパス機能の確認
  const isBypassMode = searchParams.get('bypass') === 'true'
  
  // Redirect to home page if no session exists (バイパスモードでない場合のみ)
  useEffect(() => {
    if (!isBypassMode && !isLoading && !user) {
      console.log("Dashboard: No user found, redirecting to home page")
      router.push("/")
    }
  }, [isBypassMode, isLoading, user, router])
  
  const handleSignOut = async () => {
    try {
      console.log("Dashboard: Sign out initiated")
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Dashboard: Error signing out:", error)
      // Force redirect to home page even on error
      router.push("/")
    }
  }

  useEffect(() => {
    // Load profile when user is loaded (バイパスモードの場合はスキップ)
    if (user && !isLoading && !isBypassMode) {
      loadProfile()
    } else if (isBypassMode) {
      // バイパスモードの場合はダミープロファイルを設定
      setProfile({
        id: 'bypass-user',
        full_name: 'Demo User',
        is_admin: true,
      } as Profile)
    }
  }, [user, isLoading, isBypassMode])

  useEffect(() => {
    if (isBypassMode || !user?.email) return
    if (!isBlockedAuthEmail(user.email)) return

    const forceLogout = async () => {
      await logout()
      router.push("/")
    }

    void forceLogout()
  }, [isBypassMode, user?.email, logout, router])

  const loadProfile = async () => {
    if (!user) return

    setIsLoadingProfile(true)
    setError(null)

    try {
      // Try to get profile
      console.log("Dashboard: Loading profile for user:", user.id)
      const profileData = await getProfile(user.id)
      
      // Create new profile if not found
      if (!profileData) {
        console.log("Dashboard: Profile not found, attempting to create one")
        const result = await createProfile(user.id)
        
        if (result.success) {
          console.log("Dashboard: Profile created successfully")
          const newProfileData = await getProfile(user.id)
          setProfile(newProfileData || {
            id: user.id,
            full_name: user.user_metadata?.full_name || "User",
          } as Profile)
        } else {
          console.error("Dashboard: Failed to create profile:", result.error)
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || "User",
          } as Profile)
        }
      } else {
        console.log("Dashboard: Profile loaded successfully")
        setProfile(profileData)
      }
    } catch (error: any) {
      console.error("Dashboard: Error in loadProfile:", error)
      setError(error.message || "Failed to load profile")
      setProfile({
        id: user.id,
        full_name: user.user_metadata?.full_name || "User",
      } as Profile)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Loading display while authentication is loading (バイパスモードでない場合のみ)
  if (isLoading && !isBypassMode) {
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

  // User not authenticated (バイパスモードでない場合のみ)
  if (!user && !isBypassMode) {
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
        text={`Welcome, ${profile?.full_name || "User"}${isBypassMode ? " (Demo Mode)" : ""}`}
      />

      <HkdRmbRateCard />
      <SteelPriceChartCard />
      <AluminumPriceChartCard />

      <div className="news-ticker mt-1 mb-2 overflow-hidden border-y border-gray-200 py-2">
        <div className="news-ticker-content max-h-[3rem] md:max-h-none">
          <span className="text-blue-600 font-medium text-sm md:text-base animate-marquee">
            13-02-2026 Added KHK Monitor 工廠現場監視 ・ 13-02-2026 Added NotebookLM 桐井資料博士 ・ 13-02-2026 Collectpayment 回收金額統計表
          </span>
        </div>
      </div>

      {isBypassMode && (
        <Alert className="mt-4">
          <AlertDescription>
            <strong>Demo Mode:</strong> You are currently in bypass mode. Some features may be limited.
            <Link href="/dashboard" className="text-blue-600 hover:underline ml-2">
              Exit Demo Mode
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 mt-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Department: All Employees-ERP</h3>
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            <LunchOrderCard />
            <LunchOrderSheetCard />
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center mt-6">
            <QRScanCard />
            <KHK_AI_MONITOR_Card />
          </div>
        </div>
        
        {(profile?.department?.includes("Sales") || profile?.is_admin) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Department: Sales-ERP</h3>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
              <SalespersonCalendarCard />
              <SalesDashboardCard />
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center mt-6">
              <GanttChartWBSCard />
              <CompanyInfoCard />
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center mt-6">
              <ProductManualCard />
              <CertificateCard />
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center mt-6">
              <NotebookLMCard />
              <CollectPaymentCardWrapper />
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center mt-6">
              <NewCustomerSettingCard />
            </div>
          </div>
        )}
        
        {(profile?.department?.includes("Factory") || profile?.is_admin) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Department: Factory-ERP</h3>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
              <PQFormCard />
            </div>
            <p className="text-[#3c3852] text-sm mt-1 ml-1">ISO-FAC-10(03/26)</p>
          </div>
        )}

        {(profile?.department?.includes("Purchasing") || profile?.is_admin) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Department: Purchasing</h3>
            <div className="flex flex-col gap-6 items-start">
              <SupplierInfoCard />
            </div>
          </div>
        )}

        {profile?.is_admin && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Department: ISO</h3>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
              <FormMasterCard />
            </div>
            <div className="text-[#3c3852] text-sm mt-1 ml-1">
              <p>ISO-9001:2015(Certificate No.CC1420)</p>
              <p>Effective Date 2026-04-28</p>
              <p>Expiry Date 2029-04-27</p>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </DashboardShell>
  )
}
