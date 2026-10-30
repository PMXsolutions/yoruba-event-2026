export const SESSION_COOKIE = "promax_session";
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

type SessionPayload = { sub: string; exp: number };

function sessionSecret(): string | null {
  const value = process.env.SESSION_SECRET?.trim() ?? "";
  return value.length >= 32 ? value : null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/") + pad);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function signaturesMatch(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function createSessionToken(userId: string): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify({ sub: userId, exp: Date.now() + MAX_AGE_MS } satisfies SessionPayload)),
  );
  return `${payload}.${await sign(payload, secret)}`;
}

export async function readSessionUserId(token: string | undefined | null): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = await sign(payload, secret);
  if (!signaturesMatch(signature, expected)) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as SessionPayload;
    if (!parsed.sub || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    return parsed.sub;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  };
}
