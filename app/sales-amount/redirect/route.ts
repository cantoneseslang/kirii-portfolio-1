import { NextRequest, NextResponse } from "next/server";
import { verifyFormat7AccessToken } from "@/lib/format7-access-token";
import { createSalesPortalToken } from "@/lib/sales-portal-token";
import { requireCardAccess } from "@/lib/portfolio-access";

const COOKIE_NAME = "sales_amount_portal_access";
const EXTERNAL_DASHBOARD_URL = "https://sales-dashboard-2-kirii.vercel.app/";
const EXTERNAL_TOKEN_QUERY = "portal_access";
const EXTERNAL_TOKEN_MAX_AGE_SECONDS = 120;

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const loginUrl = new URL("/", req.url);
  const access = await requireCardAccess("sales_amount");
  if (!access.ok) {
    return NextResponse.redirect(loginUrl);
  }

  const accessToken = req.cookies.get(COOKIE_NAME)?.value;
  if (!accessToken || !verifyFormat7AccessToken(accessToken)) {
    return NextResponse.redirect(loginUrl);
  }

  const target = process.env.SALES_DASHBOARD_URL || EXTERNAL_DASHBOARD_URL;
  const targetUrl = new URL(target);
  targetUrl.searchParams.set(
    EXTERNAL_TOKEN_QUERY,
    createSalesPortalToken(EXTERNAL_TOKEN_MAX_AGE_SECONDS)
  );
  const response = NextResponse.redirect(targetUrl);
  response.cookies.set(COOKIE_NAME, "", {
    path: "/sales-amount",
    maxAge: 0,
  });
  return response;
}
