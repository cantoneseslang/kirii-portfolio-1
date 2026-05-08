import type React from "react"
import "@/app/globals.css"
import "@/styles/button.css"
import { Inter, Noto_Sans_SC } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { OrderProvider } from "@/context/order-context"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const notoSansSC = Noto_Sans_SC({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto-sc" })

export const metadata = {
  title: "KIRII Portfolio",
  description: "KIRII Portfolio Dashboard",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansSC.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
          <AuthProvider>
            <OrderProvider>{children}</OrderProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
