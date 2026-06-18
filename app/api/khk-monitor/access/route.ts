import { NextResponse } from "next/server";
import { createFormat7AccessToken } from "@/lib/format7-access-token";
import {
  getRequestMeta,
  logActivityEventServer,
  requireCardAccessApi,
} from "@/lib/portfolio-access";

const COOKIE_NAME = "khk_monitor_portal_access";
const MAX_AGE_SECONDS = 1800;

export const runtime = "nodejs";

export async function GET(req: Request) {
  const access = await requireCardAccessApi("khk_ai_monitor", req);
  if (!access.ok) return access.response;

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logActivityEventServer({
    userId: access.userId,
    eventType: "portal_open",
    resourceKey: "khk_ai_monitor",
    resourcePath: "/api/khk-monitor/access",
    ipAddress,
    userAgent,
  });

  const redirectUrl = new URL("/khk-monitor/redirect", req.url);
  const response = NextResponse.redirect(redirectUrl);
  const token = createFormat7AccessToken(MAX_AGE_SECONDS);

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/khk-monitor",
    maxAge: MAX_AGE_SECONDS,
  });

  return response;
}
