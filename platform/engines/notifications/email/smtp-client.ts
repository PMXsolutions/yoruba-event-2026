import "server-only";

import nodemailer from "nodemailer";
import {
  emailConfigLogSummary,
  getSmtpConfig,
  redactSmtpErrorMessage,
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
    console.info(
      "[notification-engine] SMTP skipped — incomplete config.",
      emailConfigLogSummary(),
    );
    return { ok: false, reason: "NOT_CONFIGURED", message: "SMTP not configured" };
  }

  const toDomain = input.to.includes("@") ? input.to.split("@").pop() : "unknown";
  console.info(
    "[notification-engine] SMTP send attempt",
    emailConfigLogSummary(),
    `toDomain=${toDomain}`,
  );

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      // Port 587 typically needs STARTTLS upgrade
      requireTLS: !smtp.secure,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
      auth: {
        user: smtp.user,
        pass: smtp.password,
      },
      tls: {
        minVersion: "TLSv1.2",
      },
    });

    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    try {
      transporter.close();
    } catch {
      /* ignore */
    }

    console.info(
      "[notification-engine] SMTP email accepted by server:",
      info.messageId ?? "ok",
      `response=${typeof info.response === "string" ? info.response.slice(0, 120) : "n/a"}`,
    );
    return { ok: true, id: typeof info.messageId === "string" ? info.messageId : undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const safe = redactSmtpErrorMessage(msg);
    console.error(
      "[notification-engine] SMTP send failed:",
      safe,
      emailConfigLogSummary(),
    );
    return { ok: false, reason: "SEND_FAILED", message: "Email delivery failed" };
  }
}
