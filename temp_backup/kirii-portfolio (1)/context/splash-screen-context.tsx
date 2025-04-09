"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { usePathname } from "next/navigation"

type SplashScreenContextType = {
  hasSeenSplash: boolean
  setHasSeenSplash: (value: boolean) => void
}

const SplashScreenContext = createContext<SplashScreenContextType | undefined>(undefined)

export function SplashScreenProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenSplash, setHasSeenSplash] = useState(true) // デフォルトでtrueに設定
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  // ダッシュボードパスかどうかをチェック
  const isDashboardPath = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")

  useEffect(() => {
    // ダッシュボードパスの場合は何もしない
    if (isDashboardPath) {
      setIsLoading(false)
      return
    }

    // ホームページの場合のみスプラッシュ表示を検討
    try {
      const splashSeen = localStorage.getItem("hasSeenSplash") === "true"
      setHasSeenSplash(splashSeen)
    } catch (e) {
      // ローカルストレージにアクセスできない場合
      setHasSeenSplash(true)
    }
    setIsLoading(false)
  }, [isDashboardPath])

  // スプラッシュ表示後にローカルストレージに記録
  useEffect(() => {
    if (hasSeenSplash && !isLoading && !isDashboardPath) {
      try {
        localStorage.setItem("hasSeenSplash", "true")
      } catch (e) {
        // ローカルストレージにアクセスできない場合は無視
      }
    }
  }, [hasSeenSplash, isLoading, isDashboardPath])

  // ローディング中またはダッシュボードパスの場合は子コンポーネントのみを表示
  if (isLoading || isDashboardPath) {
    return <>{children}</>
  }

  return (
    <SplashScreenContext.Provider value={{ hasSeenSplash, setHasSeenSplash }}>
      {!hasSeenSplash ? <SplashScreen onComplete={() => setHasSeenSplash(true)} /> : null}
      <div
        style={{
          opacity: hasSeenSplash ? 1 : 0,
          transition: "opacity 0.5s ease",
          display: hasSeenSplash ? "block" : "none",
        }}
      >
        {children}
      </div>
    </SplashScreenContext.Provider>
  )
}

export const useSplashScreen = () => {
  const context = useContext(SplashScreenContext)
  if (context === undefined) {
    throw new Error("useSplashScreen must be used within a SplashScreenProvider")
  }
  return context
}

