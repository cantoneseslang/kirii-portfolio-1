"use client"

import { useEffect, useState } from "react"
import { LoginForm } from "@/components/login-form-fixed"
import { supabase } from "@/utils/supabase-fixed"

export default function TestAuthPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>("テスト中...")
  const [supabaseInfo, setSupabaseInfo] = useState<any>({})

  useEffect(() => {
    // 接続テスト
    const checkConnection = async () => {
      try {
        const result = await supabase.from("profiles").select("count", { count: "exact", head: true })
        if (result.error) {
          setConnectionStatus(`接続エラー: ${result.error.message}`)
        } else {
          setConnectionStatus("接続成功！")
        }
      } catch (e: any) {
        setConnectionStatus(`例外が発生: ${e.message}`)
      }
    }

    // Supabase情報を収集
    const getSupabaseInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        setSupabaseInfo({
          // URLはJSファイルから直接参照するように修正
          url: 'https://mnshbcvrrzlumfomniim.supabase.co',
          hasSession: !!session,
          sessionExpires: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : "なし",
          user: session?.user?.email || "ログインしていません"
        })
      } catch (e: any) {
        setSupabaseInfo({ error: e.message })
      }
    }

    checkConnection()
    getSupabaseInfo()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">認証テストページ</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Supabase接続ステータス</h2>
        <p className={connectionStatus.includes("成功") ? "text-green-600" : "text-red-600"}>
          {connectionStatus}
        </p>

        <h2 className="text-lg font-semibold mt-4 mb-2">Supabase情報</h2>
        <pre className="bg-gray-200 p-2 rounded overflow-auto text-sm">
          {JSON.stringify(supabaseInfo, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">ログインフォーム（修正版）</h2>
        <LoginForm />
      </div>

      <div className="bg-yellow-100 p-4 rounded-lg mt-8">
        <h2 className="text-lg font-semibold mb-2">問題の解決方法</h2>
        <ol className="list-decimal list-inside">
          <li className="mb-2">Supabaseの接続問題を特定</li>
          <li className="mb-2">スキーマの問題を修正するSQLを実行（Service Role権限）</li>
          <li className="mb-2">クライアントの初期化を改善</li>
          <li className="mb-2">バイパスログイン機能の追加（開発用）</li>
        </ol>
        <p className="mt-4">
          詳細な手順は <code>AUTHENTICATION_FIX_GUIDE.md</code> を参照してください。
        </p>
      </div>

      <div className="mt-8 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">修正したファイル</h2>
        <ul className="list-disc list-inside">
          <li><code>utils/supabase-fixed.ts</code> - 改善されたSupabaseクライアント</li>
          <li><code>components/login-form-fixed.tsx</code> - 修正されたログインフォーム</li>
          <li><code>fixed-user-auth-solution.sql</code> - データベース問題を修正するSQL</li>
          <li><code>all-users-import.sql</code> と <code>all-users-import-part2.sql</code> - 全ユーザーの登録</li>
        </ul>
      </div>
    </div>
  )
}
