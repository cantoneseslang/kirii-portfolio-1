import { NextRequest, NextResponse } from "next/server";
import { verifyFormat7AccessToken } from "@/lib/format7-access-token";
import { createSalesPortalToken } from "@/lib/sales-portal-token";

const COOKIE_NAME = "khk_monitor_portal_access";
const EXTERNAL_MONITOR_URL = "https://khk-monitor.vercel.app/";
const EXTERNAL_TOKEN_QUERY = "portal_access";
const EXTERNAL_TOKEN_MAX_AGE_SECONDS = 120;

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const fallbackUrl = new URL("/dashboard", req.url);
  const accessToken = req.cookies.get(COOKIE_NAME)?.value;
  if (!accessToken || !verifyFormat7AccessToken(accessToken)) {
    return NextResponse.redirect(fallbackUrl);
  }

  const targetUrl = new URL(EXTERNAL_MONITOR_URL);
  targetUrl.searchParams.set(
    EXTERNAL_TOKEN_QUERY,
    createSalesPortalToken(EXTERNAL_TOKEN_MAX_AGE_SECONDS),
  );

  const response = NextResponse.redirect(targetUrl);
  response.cookies.set(COOKIE_NAME, "", {
    path: "/khk-monitor",
    maxAge: 0,
  });
  return response;
}
