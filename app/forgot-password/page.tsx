"use client"

import { ResetPasswordForm } from "@/components/reset-password-form"
import { Footer } from "@/components/footer"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <ResetPasswordForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
