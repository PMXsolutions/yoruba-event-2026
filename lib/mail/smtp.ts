import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type SmtpEnvStatus = {
  host: boolean;
  port: boolean;
  user: boolean;
  password: boolean;
  from: boolean;
  fromName: boolean;
  ready: boolean;
};

export function getSmtpEnvStatus(): SmtpEnvStatus {
  const host = Boolean(process.env.SMTP_HOST?.trim());
  const port = Boolean(process.env.SMTP_PORT?.trim());
  const user = Boolean(process.env.SMTP_USER?.trim());
  const password = Boolean(process.env.SMTP_PASSWORD?.trim());
  const from = Boolean(process.env.MAIL_FROM?.trim());
  const fromName = Boolean(process.env.MAIL_FROM_NAME?.trim());
  return {
    host,
    port,
    user,
    password,
    from,
    fromName,
    ready: host && port && user && password && from,
  };
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const env = getSmtpEnvStatus();
  if (!env.ready) {
    throw new Error("SMTP is not fully configured. Check SMTP_* and MAIL_FROM environment variables.");
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port: Number(process.env.SMTP_PORT!.trim()),
    secure: Number(process.env.SMTP_PORT!.trim()) === 465,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASSWORD!.trim(),
    },
  });

  return cachedTransporter;
}

export type SendMailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendMailResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: "NOT_CONFIGURED" | "SEND_FAILED"; message: string };

export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  const env = getSmtpEnvStatus();
  if (!env.ready) {
    return { ok: false, reason: "NOT_CONFIGURED", message: "SMTP not configured" };
  }

  const fromEmail = process.env.MAIL_FROM!.trim();
  const fromName = process.env.MAIL_FROM_NAME?.trim();
  const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mail-service] Send failed:", msg);
    return { ok: false, reason: "SEND_FAILED", message: msg };
  }
}
