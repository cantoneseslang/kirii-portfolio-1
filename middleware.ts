import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

const FORMAT7_GATE_COOKIE = "format7_portal_gate"
const FORMAT7_SESSION_COOKIE = "format7_portal_session"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mnshbcvrrzlumfomniim.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2hiY3ZycnpsdW1mb21uaWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzk2MDksImV4cCI6MjA1OTQxNTYwOX0.trKf8ddsJh1hEYayUo6Bb3ytSFqZlNFb9lKlHsyhJ9M"

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/forgot-password",
  "/reset-password-confirmation",
])

// china-dashboard fetch-data.ps1 (HK PC) calls these without a browser session.
const PUBLIC_API_PREFIXES = ["/api/cron/", "/api/dashboard/"]
const PUBLIC_DATA_PREFIXES = ["/data/"]

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true
  if (pathname === "/api/record-login") return true
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  return PUBLIC_DATA_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url))
}

function unauthorizedApiResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

function isRedirect(response: NextResponse) {
  return response.status >= 300 && response.status < 400
}

async function getSessionResponse(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createSupabaseMiddlewareClient(request, response)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return { response, session }
}

function handleFormat7Gate(request: NextRequest, baseResponse: NextResponse) {
  const gate = request.cookies.get(FORMAT7_GATE_COOKIE)?.value
  const session = request.cookies.get(FORMAT7_SESSION_COOKIE)?.value
  const allowBySession = Boolean(session)
  let allowByReferer = false

  const referer = request.headers.get("referer")
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const isSameOrigin = refererUrl.origin === request.nextUrl.origin
      const isAllowedPath =
        refererUrl.pathname.startsWith("/api/format7/access") ||
        refererUrl.pathname.startsWith("/dashboard") ||
        refererUrl.pathname.startsWith("/format7/latest")

      allowByReferer = isSameOrigin && isAllowedPath
    } catch {
      return redirectToLogin(request)
    }
  }

  if (!gate && !allowByReferer && !allowBySession) {
    return redirectToLogin(request)
  }

  if (gate) {
    baseResponse.cookies.set(FORMAT7_GATE_COOKIE, "", {
      path: "/format7",
      maxAge: 0,
    })
  }

  return baseResponse
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    if (pathname !== "/") {
      return NextResponse.next()
    }

    const { response, session } = await getSessionResponse(request)
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return response
  }

  const { response, session } = await getSessionResponse(request)

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return unauthorizedApiResponse()
    }
    return redirectToLogin(request)
  }

  if (pathname.startsWith("/format7/latest")) {
    return handleFormat7Gate(request, response)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
