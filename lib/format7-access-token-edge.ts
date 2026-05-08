const ACCESS_SECRET_FALLBACK = "format7-dev-secret";

function getAccessSecret() {
  return (
    process.env.FORMAT7_ACCESS_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.OAUTH_CLIENT_SECRET ||
    ACCESS_SECRET_FALLBACK
  );
}

function decodeBase64UrlToBytes(base64url: string) {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeBase64UrlToString(base64url: string) {
  const bytes = decodeBase64UrlToBytes(base64url);
  return new TextDecoder().decode(bytes);
}

export async function verifyFormat7AccessTokenEdge(token: string) {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAccessSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    decodeBase64UrlToBytes(signature),
    new TextEncoder().encode(payloadBase64),
  );
  if (!isValid) return false;

  try {
    const payload = JSON.parse(decodeBase64UrlToString(payloadBase64)) as { exp?: number };
    if (!payload.exp || typeof payload.exp !== "number") return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
