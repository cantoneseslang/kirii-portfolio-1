import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getRequestMeta,
  logActivityEventServer,
  requireCardAccessApi,
} from "@/lib/portfolio-access";

const COOKIE_NAME = "format7_portal_gate";
const SESSION_COOKIE_NAME = "format7_portal_session";
const INTENT_COOKIE_NAME = "format7_dashboard_intent";
const SESSION_MAX_AGE_SEC = 60 * 45;

export const runtime = "nodejs";

export async function GET(req: Request) {
  const access = await requireCardAccessApi("collect_payment", req);
  if (!access.ok) return access.response;

  const reqUrl = new URL(req.url);
  const referer = req.headers.get("referer");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const userAgent = req.headers.get("user-agent") ?? "";
  const hasIntentCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .some((item) => item === `${INTENT_COOKIE_NAME}=1`);

  let hasValidReferer = false;

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const isSameOrigin = refererUrl.origin === reqUrl.origin;
      const isDashboardFlow = refererUrl.pathname.startsWith("/dashboard");
      hasValidReferer = isSameOrigin && isDashboardFlow;
    } catch {
      hasValidReferer = false;
    }
  }

  if (!hasValidReferer && !hasIntentCookie) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { ipAddress } = getRequestMeta(req);
  await logActivityEventServer({
    userId: access.userId,
    eventType: "portal_open",
    resourceKey: "collect_payment",
    resourcePath: "/api/format7/access",
    ipAddress,
    userAgent,
  });

  const redirectUrl = new URL("/format7/latest", req.url);
  const response = NextResponse.redirect(redirectUrl);
  const oneTimeGate = randomUUID();

  response.cookies.set(COOKIE_NAME, oneTimeGate, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/format7",
  });
  response.cookies.set(SESSION_COOKIE_NAME, randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/format7",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  response.cookies.set(INTENT_COOKIE_NAME, "", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
