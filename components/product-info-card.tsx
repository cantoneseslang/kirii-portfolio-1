"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Award } from "lucide-react"

export default function ProductInfoCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Product Information
        </CardTitle>
        <CardDescription>
          產品資料與證書管理
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* 產品說明書カード */}
          <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-sm">產品說明書</h4>
                    <p className="text-xs text-gray-600">Product Manual</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    // TODO: PDF表示ロジックを実装
                    console.log("產品說明書 PDF を開く")
                  }}
                >
                  開く
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certificate保證書カード */}
          <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-sm">Certificate保證書</h4>
                    <p className="text-xs text-gray-600">Product Certificate</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    // TODO: PDF表示ロジックを実装
                    console.log("Certificate保證書 PDF を開く")
                  }}
                >
                  開く
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
} 