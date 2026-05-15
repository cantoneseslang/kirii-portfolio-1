import { NextRequest, NextResponse } from "next/server";
import { verifyFormat7AccessTokenEdge } from "@/lib/format7-access-token-edge";

const PRODUCT_MANUAL_COOKIE = "product_manual_portal_access";
const CERTIFICATION_COOKIE = "certification_portal_access";
const FORMAT7_GATE_COOKIE = "format7_portal_gate";
const FORMAT7_SESSION_COOKIE = "format7_portal_session";

function redirectToDashboard(request: NextRequest) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url));
}

async function hasValidToken(tokenValue: string | undefined) {
  if (!tokenValue) return false;
  return verifyFormat7AccessTokenEdge(tokenValue);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/product-manual")) {
    const token = request.cookies.get(PRODUCT_MANUAL_COOKIE)?.value;
    if (!(await hasValidToken(token))) {
      return redirectToDashboard(request);
    }
  }

  if (pathname.startsWith("/certification")) {
    const token = request.cookies.get(CERTIFICATION_COOKIE)?.value;
    if (!(await hasValidToken(token))) {
      return redirectToDashboard(request);
    }
  }

  if (pathname.startsWith("/format7/latest")) {
    const gate = request.cookies.get(FORMAT7_GATE_COOKIE)?.value;
    const session = request.cookies.get(FORMAT7_SESSION_COOKIE)?.value;
    const allowBySession = Boolean(session);
    let allowByReferer = false;

    // Keep strict referer validation when available, but don't require it.
    // Some valid new-tab flows can drop referer in automation/privacy contexts.
    const referer = request.headers.get("referer");
    if (referer) {
      let refererUrl: URL;
      try {
        refererUrl = new URL(referer);
      } catch {
        return redirectToLogin(request);
      }

      const isSameOrigin = refererUrl.origin === request.nextUrl.origin;
      const isAllowedPath =
        refererUrl.pathname.startsWith("/api/format7/access") ||
        refererUrl.pathname.startsWith("/dashboard") ||
        refererUrl.pathname.startsWith("/format7/latest");

      if (!isSameOrigin || !isAllowedPath) {
        return redirectToLogin(request);
      }

      allowByReferer = true;
    }

    if (!gate && !allowByReferer && !allowBySession) {
      return redirectToLogin(request);
    }

    // One-time gate: consume immediately so reload / direct re-open is blocked.
    const response = NextResponse.next();
    if (gate) {
      response.cookies.set(FORMAT7_GATE_COOKIE, "", {
        path: "/format7",
        maxAge: 0,
      });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/product-manual/:path*",
    "/certification/:path*",
    "/format7/latest",
    "/format7/latest/:path*",
  ],
};
