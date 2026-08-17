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
import { Footer } from "@/components/footer"
import GanttChartWBSCard from "@/components/gantt-chart-wbs-card"
import QRScanCard from "@/components/qr-scan-card";
import KHK_AI_MONITOR_Card from "@/components/khk-ai-monitor-card";
import CompanyInfoCard from "@/components/company-info-card";
import ProductManualCard from "@/components/product-manual-card";
import PQFormCard from "@/components/pq-form-card";
import ManufacturingOrderCard from "@/components/manufacturing-order-card";
import MaterialStockCard from "@/components/material-stock-card";
import InventorySummaryCard from "@/components/inventory-summary-card";
import ShippingStatusCard from "@/components/shipping-status-card";
import MillCertificationCard from "@/components/mill-certification-card";
import CertificateCard from "@/components/certificate-card";
import CollectPaymentCardWrapper from "@/components/collect-payment-card-wrapper";
import SalespersonCalendarCard from "@/components/salesperson-calendar-card";
import SteelPriceChartCard from "@/components/steel-price-chart-card";
import AluminumPriceChartCard from "@/components/aluminum-price-chart-card";
import FormMasterCard from "@/components/form-master-card";
import HkdRmbRateCard from "@/components/hkd-rmb-rate-card";
import NewCustomerSettingCard from "@/components/new-customer-setting-card";
import NewCustomerApprovalsCard from "@/components/new-customer-approvals-card";
import { DashboardPersonalSummary } from "@/components/dashboard-personal-summary";
import { DashboardNewsTicker } from "@/components/dashboard-news-ticker";
import { isBlockedAuthEmail } from "@/lib/blocked-auth-emails";
import { getApproverRole } from "@/lib/hk-new-customer-approval";
import { hasCardPermission } from "@/lib/card-permissions";
import { trackPageView } from "@/lib/track-activity";
import { TrackedCardShell } from "@/components/tracked-card-shell";

const DASHBOARD_NEWS_TICKER =
  "15-04-2026 追加Foodpanda 追加午餐內容 ・ 09-06-2026 NewCustomer Setting 新客戶登記 ・ 11-06-2026 Update Lunch Order System 更新午餐訂購系統";

const DASHBOARD_CARD_GRID = "grid grid-cols-1 md:grid-cols-[repeat(2,420px)] gap-6"
const DASHBOARD_CARD_GRID_SINGLE = "grid grid-cols-1 md:grid-cols-[420px] gap-6"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // Force redirect to home page even on error
      router.push("/")
    }
  }

  useEffect(() => {
    if (user && !isLoading) {
      loadProfile()
    }
  }, [user, isLoading])

  useEffect(() => {
    if (!user?.email) return
    if (!isBlockedAuthEmail(user.email)) return

    const forceLogout = async () => {
      await logout()
      router.push("/")
    }

    void forceLogout()
  }, [user?.email, logout, router])

  useEffect(() => {
    if (!profile) return
    if (profile.is_active === false) {
      void logout().then(() => router.push("/"))
    }
  }, [profile, logout, router])

  useEffect(() => {
    if (!user) return
    trackPageView("/dashboard")
  }, [user])

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
      <DashboardNewsTicker text={DASHBOARD_NEWS_TICKER} />

      <DashboardHeader
        heading="Dashboard"
        text={`Welcome, ${profile?.full_name || "User"}`}
      />

      <DashboardPersonalSummary
        email={user?.email || null}
        fullName={profile?.full_name || (user?.user_metadata?.full_name as string | undefined) || null}
      />

      <HkdRmbRateCard />
      <SteelPriceChartCard />
      <AluminumPriceChartCard />

      {user?.email && getApproverRole(user.email) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">New Customer Approval / 新客戶登記審批</h3>
          <div className={DASHBOARD_CARD_GRID_SINGLE}>
            <NewCustomerApprovalsCard />
          </div>
        </div>
      )}

      <div className="grid gap-8 mt-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Department: All Employees-ERP</h3>
          <div className={DASHBOARD_CARD_GRID}>
            {hasCardPermission(profile, "lunch_order") && (
              <TrackedCardShell cardKey="lunch_order">
                <LunchOrderCard
                  fullName={profile?.full_name || user?.user_metadata?.full_name || null}
                  email={user?.email || null}
                />
              </TrackedCardShell>
            )}
            {hasCardPermission(profile, "lunch_order_sheet") && (
              <TrackedCardShell cardKey="lunch_order_sheet">
                <LunchOrderSheetCard />
              </TrackedCardShell>
            )}
            {hasCardPermission(profile, "qr_scan") && (
              <TrackedCardShell cardKey="qr_scan">
                <QRScanCard />
              </TrackedCardShell>
            )}
            {hasCardPermission(profile, "khk_ai_monitor") && (
              <TrackedCardShell cardKey="khk_ai_monitor">
                <KHK_AI_MONITOR_Card />
              </TrackedCardShell>
            )}
          </div>
        </div>
        
        {(hasCardPermission(profile, "salesperson_calendar") ||
          hasCardPermission(profile, "sales_amount") ||
          hasCardPermission(profile, "gantt_wbs") ||
          hasCardPermission(profile, "company_info") ||
          hasCardPermission(profile, "product_manual") ||
          hasCardPermission(profile, "certificate") ||
          hasCardPermission(profile, "collect_payment") ||
          hasCardPermission(profile, "new_customer_setting")) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Department: Sales-ERP</h3>
            <div className={DASHBOARD_CARD_GRID}>
              {hasCardPermission(profile, "salesperson_calendar") && (
                <TrackedCardShell cardKey="salesperson_calendar">
                  <SalespersonCalendarCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "sales_amount") && (
                <TrackedCardShell cardKey="sales_amount">
                  <SalesDashboardCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "gantt_wbs") && (
                <TrackedCardShell cardKey="gantt_wbs">
                  <GanttChartWBSCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "company_info") && (
                <TrackedCardShell cardKey="company_info">
                  <CompanyInfoCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "product_manual") && (
                <TrackedCardShell cardKey="product_manual">
                  <ProductManualCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "certificate") && (
                <TrackedCardShell cardKey="certificate">
                  <CertificateCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "collect_payment") && (
                <TrackedCardShell cardKey="collect_payment">
                  <CollectPaymentCardWrapper />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "new_customer_setting") && (
                <TrackedCardShell cardKey="new_customer_setting">
                  <NewCustomerSettingCard />
                </TrackedCardShell>
              )}
            </div>
          </div>
        )}
        
        {(hasCardPermission(profile, "pq_form") ||
          hasCardPermission(profile, "manufacturing_order") ||
          hasCardPermission(profile, "material_stock") ||
          hasCardPermission(profile, "mill_certification")) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Department: Factory-ERP</h3>
            <div className={DASHBOARD_CARD_GRID}>
              {hasCardPermission(profile, "pq_form") && (
                <TrackedCardShell cardKey="pq_form">
                  <PQFormCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "manufacturing_order") && (
                <TrackedCardShell cardKey="manufacturing_order">
                  <ManufacturingOrderCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "material_stock") && (
                <TrackedCardShell cardKey="material_stock">
                  <MaterialStockCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "mill_certification") && (
                <TrackedCardShell cardKey="mill_certification">
                  <MillCertificationCard />
                </TrackedCardShell>
              )}
            </div>
          </div>
        )}

        {(hasCardPermission(profile, "inventory_summary") ||
          hasCardPermission(profile, "shipping_status")) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Department: warehouse</h3>
            <div className={DASHBOARD_CARD_GRID}>
              {hasCardPermission(profile, "inventory_summary") && (
                <TrackedCardShell cardKey="inventory_summary">
                  <InventorySummaryCard />
                </TrackedCardShell>
              )}
              {hasCardPermission(profile, "shipping_status") && (
                <TrackedCardShell cardKey="shipping_status">
                  <ShippingStatusCard />
                </TrackedCardShell>
              )}
            </div>
          </div>
        )}

        {hasCardPermission(profile, "supplier_info") && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Department: Purchasing</h3>
            <div className={DASHBOARD_CARD_GRID_SINGLE}>
              <TrackedCardShell cardKey="supplier_info">
                <SupplierInfoCard />
              </TrackedCardShell>
            </div>
          </div>
        )}

        {hasCardPermission(profile, "form_master") && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Department: ISO</h3>
            <div className={DASHBOARD_CARD_GRID_SINGLE}>
              <TrackedCardShell cardKey="form_master">
                <FormMasterCard />
              </TrackedCardShell>
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
