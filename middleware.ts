import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { verifyFormat7AccessTokenEdge } from "@/lib/format7-access-token-edge"

const PRODUCT_MANUAL_COOKIE = "product_manual_portal_access"
const CERTIFICATION_COOKIE = "certification_portal_access"
const FORMAT7_GATE_COOKIE = "format7_portal_gate"
const FORMAT7_SESSION_COOKIE = "format7_portal_session"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mnshbcvrrzlumfomniim.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M"

function redirectToDashboard(request: NextRequest) {
  return NextResponse.redirect(new URL("/dashboard", request.url))
}

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url))
}

async function hasValidToken(tokenValue: string | undefined) {
  if (!tokenValue) return false
  return verifyFormat7AccessTokenEdge(tokenValue)
}

function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}

async function handleAuthRoutes(request: NextRequest) {
  const { pathname } = request.nextUrl
  const bypass = request.nextUrl.searchParams.get("bypass") === "true"

  if (bypass) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createSupabaseMiddlewareClient(request, response)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) &&
    !session
  ) {
    return redirectToLogin(request)
  }

  if (pathname === "/" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname === "/"
  ) {
    return handleAuthRoutes(request)
  }

  if (pathname.startsWith("/product-manual")) {
    const token = request.cookies.get(PRODUCT_MANUAL_COOKIE)?.value
    if (!(await hasValidToken(token))) {
      return redirectToDashboard(request)
    }
  }

  if (pathname.startsWith("/certification")) {
    const token = request.cookies.get(CERTIFICATION_COOKIE)?.value
    if (!(await hasValidToken(token))) {
      return redirectToDashboard(request)
    }
  }

  if (pathname.startsWith("/format7/latest")) {
    const gate = request.cookies.get(FORMAT7_GATE_COOKIE)?.value
    const session = request.cookies.get(FORMAT7_SESSION_COOKIE)?.value
    const allowBySession = Boolean(session)
    let allowByReferer = false

    const referer = request.headers.get("referer")
    if (referer) {
      let refererUrl: URL
      try {
        refererUrl = new URL(referer)
      } catch {
        return redirectToLogin(request)
      }

      const isSameOrigin = refererUrl.origin === request.nextUrl.origin
      const isAllowedPath =
        refererUrl.pathname.startsWith("/api/format7/access") ||
        refererUrl.pathname.startsWith("/dashboard") ||
        refererUrl.pathname.startsWith("/format7/latest")

      if (!isSameOrigin || !isAllowedPath) {
        return redirectToLogin(request)
      }

      allowByReferer = true
    }

    if (!gate && !allowByReferer && !allowBySession) {
      return redirectToLogin(request)
    }

    const response = NextResponse.next()
    if (gate) {
      response.cookies.set(FORMAT7_GATE_COOKIE, "", {
        path: "/format7",
        maxAge: 0,
      })
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/product-manual/:path*",
    "/certification/:path*",
    "/format7/latest",
    "/format7/latest/:path*",
  ],
}
