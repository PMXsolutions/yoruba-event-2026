import "server-only";

import nodemailer from "nodemailer";
import {
  getSmtpConfig,
  resolveMailFrom,
} from "@/platform/engines/notifications/email/env-status";

export type SmtpSendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SmtpSendResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "NOT_CONFIGURED" | "SEND_FAILED"; message: string };

/**
 * SMTP transport via nodemailer.
 * Never logs passwords. Never throws to callers.
 */
export async function sendViaSmtp(input: SmtpSendInput): Promise<SmtpSendResult> {
  const smtp = getSmtpConfig();
  const from = resolveMailFrom();
  if (!smtp || !from) {
    return { ok: false, reason: "NOT_CONFIGURED", message: "SMTP not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.password,
      },
    });

    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    console.info("[notification-engine] SMTP email sent:", info.messageId ?? "ok");
    return { ok: true, id: typeof info.messageId === "string" ? info.messageId : undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Never include auth credentials in logs
    console.error("[notification-engine] SMTP send failed:", msg.replace(/pass(word)?[=:].*/gi, "[redacted]"));
    return { ok: false, reason: "SEND_FAILED", message: "Email delivery failed" };
  }
}
