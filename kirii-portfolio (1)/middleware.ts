import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnshbcvrrzlumfomniim.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // URLからバイパスパラメータを確認
  const { searchParams } = new URL(request.url)
  const bypass = searchParams.get('bypass') === 'true'

  // バイパスモードが有効な場合は認証をスキップ
  if (bypass) {
    return response
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()

    // ダッシュボードとアドミンページの保護（セッションがない場合はホームにリダイレクト）
    if ((request.nextUrl.pathname.startsWith('/dashboard') || 
         request.nextUrl.pathname.startsWith('/admin')) && 
        !session) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // ログイン済みユーザーがホームページにアクセスした場合はダッシュボードにリダイレクト
    if (request.nextUrl.pathname === '/' && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (e) {
    // エラーが発生した場合はコンソールに記録し、リクエストを続行
    console.error('Auth middleware error:', e)
  }

  return response
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/admin/:path*'],
}
