import { createHmac, randomBytes } from "crypto";

const DEFAULT_MAX_AGE_SECONDS = 120;
const SHARED_SECRET_FALLBACK = "format7-dev-secret";

function getSalesPortalSecret() {
  return process.env.SALES_PORTAL_SHARED_SECRET || SHARED_SECRET_FALLBACK;
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payloadBase64: string, secret: string) {
  return createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

export function createSalesPortalToken(maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const expiresAt = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = {
    exp: expiresAt,
    nonce: randomBytes(8).toString("hex"),
  };
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadBase64, getSalesPortalSecret());
  return `${payloadBase64}.${signature}`;
}
