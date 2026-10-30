import "server-only";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSessionToken,
  readSessionUserId,
  sessionCookieOptions,
} from "@/lib/auth/session-token";

export async function readRequestSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return readSessionUserId(jar.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(userId: string): Promise<boolean> {
  const token = await createSessionToken(userId);
  if (!token) return false;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
  return true;
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
}
