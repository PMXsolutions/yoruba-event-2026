import { createHmac, timingSafeEqual, createHash } from "node:crypto";
export const CAMPAIGN = "yoruba-day-canberra-2026";
export const RELEASE = "daily-comms-20261113-v1";
export function schedule(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (key: string) => parts.find(p => p.type === key)?.value ?? "";
  const day = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = Number(get("hour"));
  const active = day >= "2026-11-13" && day <= "2026-11-21";
  return { day, hour, attendeeDue: active && hour >= 10 && hour < 12, committeeDue: active && hour >= 18 && hour < 20 };
}
export function recipientKey(recipient: string) { return createHash("sha256").update(recipient.trim().toLowerCase()).digest("hex"); }
export function validCronSignature(timestamp: string | null, signature: string | null, secret: string | undefined, now = Date.now()) {
  if (!secret || secret.length < 32 || !timestamp || !/^\d{13}$/.test(timestamp) || !signature || !/^[a-f0-9]{64}$/.test(signature)) return false;
  if (Math.abs(now - Number(timestamp)) > 5 * 60_000) return false;
  const expected = createHmac("sha256", secret).update(`yoruba-daily:${timestamp}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
