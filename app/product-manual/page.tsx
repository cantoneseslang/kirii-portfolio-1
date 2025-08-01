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
    name: "Catalogue of Naka Hi-Hatch ceiling access hatch",
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
          <Link key={index} href={folder.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Folder className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{folder.name}</h3>
                    <p className="text-sm text-muted-foreground">{folder.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
} 