import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const DEFAULT_MAX_AGE_SECONDS = 120;
const ACCESS_SECRET_FALLBACK = "format7-dev-secret";

function getAccessSecret() {
  return (
    process.env.FORMAT7_ACCESS_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.OAUTH_CLIENT_SECRET ||
    ACCESS_SECRET_FALLBACK
  );
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payloadBase64: string, secret: string) {
  return createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

export function createFormat7AccessToken(maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const expiresAt = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = {
    exp: expiresAt,
    nonce: randomBytes(8).toString("hex"),
  };
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadBase64, getAccessSecret());
  return `${payloadBase64}.${signature}`;
}

export function verifyFormat7AccessToken(token: string) {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return false;

  const expectedSignature = signPayload(payloadBase64, getAccessSecret());
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadBase64)) as { exp?: number };
    if (!payload.exp || typeof payload.exp !== "number") return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
