import { NextResponse } from "next/server";
import { createFormat7AccessToken } from "@/lib/format7-access-token";
import {
  getRequestMeta,
  logActivityEventServer,
  requireCardAccessApi,
} from "@/lib/portfolio-access";

const COOKIE_NAME = "sales_amount_portal_access";
const MAX_AGE_SECONDS = 1800;

export const runtime = "nodejs";

export async function GET(req: Request) {
  const access = await requireCardAccessApi("sales_amount", req);
  if (!access.ok) return access.response;

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logActivityEventServer({
    userId: access.userId,
    eventType: "portal_open",
    resourceKey: "sales_amount",
    resourcePath: "/api/sales-amount/access",
    ipAddress,
    userAgent,
  });

  const redirectUrl = new URL("/sales-amount/redirect", req.url);
  const response = NextResponse.redirect(redirectUrl);
  const token = createFormat7AccessToken(MAX_AGE_SECONDS);

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/sales-amount",
    maxAge: MAX_AGE_SECONDS,
  });

  return response;
}
