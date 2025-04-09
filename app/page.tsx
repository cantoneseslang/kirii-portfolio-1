"use client"

import { Suspense, useState, useEffect } from "react"
import { Logo } from "@/components/logo"
import { LoginForm } from "@/components/login-form"
import { Footer } from "@/components/footer"
import { SplashAnimation } from "@/components/splash-animation"

export default function Home() {
  const [splashComplete, setSplashComplete] = useState(false)
  
  // スプラッシュアニメーション完了後の処理
  const handleSplashComplete = () => {
    setSplashComplete(true)
  }
  
  return (
    <>
      {!splashComplete && (
        <SplashAnimation onComplete={handleSplashComplete} />
      )}
      
      {splashComplete && (
        <div className="min-h-screen flex flex-col">
          <header className="p-4 border-b flex justify-between items-center">
            <Logo />
          </header>
          <main className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">KIRII Employee Portfolio</h1>
                <p className="text-muted-foreground mt-2">Access restricted to registered employees only</p>
              </div>
              <Suspense fallback={<div className="p-4 text-center">Loading login form...</div>}>
                <LoginForm />
              </Suspense>
            </div>
          </main>
          <Footer />
        </div>
      )}
    </>
  )
}
