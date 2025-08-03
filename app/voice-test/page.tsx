"use client"

import { VoiceAssistant } from "@/components/voice-assistant"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VoiceTestPage() {
  // コールバック関数は不要になったため削除

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">語音助手測試</h1>
          <p className="text-muted-foreground mt-2">語音助手測試頁面</p>
        </div>

        {/* 音声アシスタント */}
        <div className="flex justify-center">
          <VoiceAssistant />
        </div>

        {/* テスト説明 */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">測試說明</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">可用指令:</h3>
                <ul className="space-y-1 ml-4">
                  <li>• "今日幾點" - 查詢今日日期和時間</li>
                  <li>• "今日食咩" - 午餐菜單查詢</li>
                  <li>• "飲咩" - 飲品菜單查詢</li>
                  <li>• "搵文件" - 證書文件搜尋</li>
                  <li>• "你好" - 打招呼</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2">注意事項:</h3>
                <ul className="space-y-1 ml-4">
                  <li>• 請使用廣東話說話</li>
                  <li>• 需要瀏覽器支援語音識別功能</li>
                  <li>• 需要麥克風權限</li>
                  <li>• 建議使用Chrome或Safari瀏覽器</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">功能特點:</h3>
                <ul className="space-y-1 ml-4">
                  <li>• 自動識別今日日期和時間</li>
                  <li>• 廣東話語音合成</li>
                  <li>• AI輔助對話</li>
                  <li>• 按鈕操作代勞</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 