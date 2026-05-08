import { NextResponse } from "next/server";
import { createFormat7AccessToken } from "@/lib/format7-access-token";

const COOKIE_NAME = "sales_amount_portal_access";
const MAX_AGE_SECONDS = 1800;

export const runtime = "nodejs";

export async function GET(req: Request) {
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
