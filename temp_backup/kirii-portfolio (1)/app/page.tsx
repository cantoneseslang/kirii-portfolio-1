"use client"

import { Suspense } from "react"
import { Logo } from "@/components/logo"
import { LoginForm } from "@/components/login-form"
import { AdminRegister } from "@/components/admin-register"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b flex justify-between items-center">
        <Logo />
        <AdminRegister />
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
  )
}
