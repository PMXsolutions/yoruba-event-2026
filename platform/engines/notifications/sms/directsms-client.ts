import "server-only";

import type { SendSmsResult } from "@/platform/engines/notifications/sms/result";
import { isAllowedDirectSmsUrl } from "@/platform/engines/notifications/sms/format";

export type DirectSmsRequest = {
  apiUrl: string;
  username: string;
  password: string;
  senderId: string;
  messageType: string;
  to: string;
  message: string;
};

function safeLog(body: string, password: string): string {
  let text = body.replace(/\s+/g, " ").trim().slice(0, 180);
  if (password) text = text.split(password).join("***");
  return text.replace(/password=[^&\s]+/gi, "password=***");
}

function interpretResponse(status: number, body: string): { ok: true; sid?: string } | { ok: false } {
  const trimmed = body.trim();
  if (status < 200 || status >= 300 || !trimmed) return { ok: false };
  const idMatch = trimmed.match(/\bid\s*[:=]\s*([A-Za-z0-9_-]+)/i);
  const looksLikeError = /error|invalid|fail|denied|unauthor/i.test(trimmed) && !idMatch;
  if (looksLikeError) return { ok: false };
  if (idMatch) return { ok: true, sid: idMatch[1] };
  if (/^\d+$/.test(trimmed)) return { ok: true, sid: trimmed };
  return { ok: false };
}

/**
 * DirectSMS HTTP send. Credentials travel on the query string because that is
 * the gateway contract. The request URL is never logged.
 */
export async function sendDirectSms(input: DirectSmsRequest): Promise<SendSmsResult> {
  if (!isAllowedDirectSmsUrl(input.apiUrl)) {
    return { ok: false, reason: "NOT_CONFIGURED", message: "DirectSMS URL is not allowed" };
  }
  if (!input.username || !input.password) {
    return { ok: false, reason: "NOT_CONFIGURED", message: "DirectSMS is not configured" };
  }

  const url = new URL(input.apiUrl);
  url.searchParams.set("username", input.username);
  url.searchParams.set("password", input.password);
  url.searchParams.set("message", input.message);
  url.searchParams.set("type", input.messageType);
  url.searchParams.set("senderid", input.senderId);
  url.searchParams.set("to", input.to);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();
    const parsed = interpretResponse(response.status, body);
    if (!parsed.ok) {
      console.error(
        "[notification-engine] DirectSMS rejected the message:",
        response.status,
        safeLog(body, input.password),
      );
      return { ok: false, reason: "SEND_FAILED", message: "DirectSMS did not accept the message" };
    }
    return { ok: true, sid: parsed.sid };
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    console.error("[notification-engine] DirectSMS request failed:", message.slice(0, 160));
    return { ok: false, reason: "SEND_FAILED", message: "SMS delivery failed" };
  }
}
