"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Folder } from "lucide-react"
import Link from "next/link"

const folders = [
  {
    name: "Gypsum board",
    description: "石膏板製品資料",
    href: "/product-manual/gypsum-board"
  },
  {
    name: "James Hardie",
    description: "James Hardie製品資料",
    href: "/product-manual/james-hardie"
  },
  {
    name: "Job Reference",
    description: "工事参考資料",
    href: "/product-manual/job-reference"
  },
  {
    name: "Metal Framing",
    description: "金属フレーミング資料",
    href: "/product-manual/metal-framing"
  },
  {
    name: "Hi-Hatch ceiling access hatch",
    description: "Naka Hi-Hatch天井アクセスハッチカタログ",
    href: "/product-manual/naka-hi-hatch"
  }
]

export default function ProductManualPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Product Manual</h1>
        <p className="text-muted-foreground mt-2">產品說明書 - 製品資料フォルダ</p>
      </div>

      <div className="grid gap-4">
        {folders.map((folder, index) => (
          <Link key={index} href={folder.href} className="block w-full">
            <div className="w-full relative p-4 rounded-xl bg-[#f1f1f3] shadow-sm cursor-pointer transition-all hover:shadow-md">
              <h3 className="text-xl font-bold hover:text-[#02315a] hover:underline transition-colors">{folder.name}</h3>
              <p className="text-[#3c3852] text-sm mt-4">{folder.description}</p>
              
              <div className="absolute bottom-0 right-0 bg-[#02315a] p-1.5 rounded-tl-xl rounded-br-xl flex items-center justify-center transition-colors hover:bg-[#02315a] group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height={15} width={15} className="transition-transform group-hover:translate-x-0.5">
                  <path fill="#fff" d="M13.4697 17.9697C13.1768 18.2626 13.1768 18.7374 13.4697 19.0303C13.7626 19.3232 14.2374 19.3232 14.5303 19.0303L20.3232 13.2374C21.0066 12.554 21.0066 11.446 20.3232 10.7626L14.5303 4.96967C14.2374 4.67678 13.7626 4.67678 13.4697 4.96967C13.1768 5.26256 13.1768 5.73744 13.4697 6.03033L18.6893 11.25H4C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75H18.6893L13.4697 17.9697Z" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 