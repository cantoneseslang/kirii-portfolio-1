import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const COOKIE_NAME = "format7_portal_gate";
const INTENT_COOKIE_NAME = "format7_dashboard_intent";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const referer = req.headers.get("referer");
  const loginUrl = new URL("/", req.url);
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

  console.log(
    `[format7_access] incoming path=${reqUrl.pathname} referer=${referer ?? "none"} intent=${hasIntentCookie} ua=${userAgent.slice(0, 80)}`
  );

  // Allow either strict dashboard referer OR a short-lived click intent cookie.
  if (!hasValidReferer && !hasIntentCookie) {
    console.log("[format7_access] blocked -> redirect / (missing valid referer and intent)");
    return NextResponse.redirect(loginUrl);
  }

  const redirectUrl = new URL("/format7/latest", req.url);
  const response = NextResponse.redirect(redirectUrl);
  const oneTimeGate = randomUUID();

  response.cookies.set(COOKIE_NAME, oneTimeGate, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/format7",
  });
  response.cookies.set(INTENT_COOKIE_NAME, "", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  console.log("[format7_access] allowed -> redirect /format7/latest and set one-time gate");

  return response;
}
