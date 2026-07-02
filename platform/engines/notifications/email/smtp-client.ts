import "server-only";

import { sendMail, type SendMailResult } from "@/lib/mail";
import {
  buildRsvpConfirmationAttachments,
  buildRsvpConfirmationEmail,
  type RsvpConfirmationEmailParams,
} from "@/platform/engines/notifications/email/templates/rsvp-confirmation";
import { getSmtpEnvStatus } from "@/lib/mail/smtp";

export type { SendMailResult };

/**
 * SMTP email client — activates when SMTP_* and MAIL_FROM env vars are set.
 * Never throws; RSVP submission must not depend on email delivery.
 */
export async function sendRsvpConfirmationEmail(
  params: RsvpConfirmationEmailParams,
): Promise<SendMailResult> {
  const env = getSmtpEnvStatus();
  if (!env.ready) {
    console.info("[notification-engine] Email skipped — SMTP not configured.");
    return { ok: false, reason: "NOT_CONFIGURED", message: "SMTP not configured" };
  }

  const { subject, html, text } = buildRsvpConfirmationEmail(params);
  const attachments = buildRsvpConfirmationAttachments(params.event).map((a) => ({
    filename: a.filename,
    content: a.content,
    contentType: "text/calendar",
  }));

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST!.trim(),
      port: Number(process.env.SMTP_PORT!.trim()),
      secure: Number(process.env.SMTP_PORT!.trim()) === 465,
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASSWORD!.trim(),
      },
    });

    const fromEmail = process.env.MAIL_FROM!.trim();
    const fromName = process.env.MAIL_FROM_NAME?.trim();
    const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

    const info = await transporter.sendMail({
      from,
      to: params.record.email,
      subject,
      html,
      text,
      attachments,
    });

    console.info("[notification-engine] Confirmation email sent:", info.messageId);
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notification-engine] SMTP send failed:", msg);
    return { ok: false, reason: "SEND_FAILED", message: msg };
  }
}

export async function sendSponsorConfirmationEmail(params: {
  company: string;
  contactPerson: string;
  email: string;
  packageName: string;
  eventName: string;
  organisation: string;
  contactEmail: string;
}): Promise<SendMailResult> {
  const env = getSmtpEnvStatus();
  if (!env.ready) {
    return { ok: false, reason: "NOT_CONFIGURED", message: "SMTP not configured" };
  }

  const subject = `Sponsorship enquiry received — ${params.eventName}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;background:#faf6ef;padding:32px 16px;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8dfd0;border-radius:16px;padding:32px">
    <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#8a6f38;margin:0 0 8px">${params.organisation}</p>
    <h1 style="font-size:24px;margin:0 0 16px;color:#24150f">Thank you, ${params.contactPerson}</h1>
    <p style="line-height:1.7;color:#3a2419">We have received your sponsorship enquiry for <strong>${params.packageName}</strong> on behalf of <strong>${params.company}</strong>.</p>
    <p style="line-height:1.7;color:#3a2419">Our partnerships team will review your application and be in touch within 3–5 business days with the full sponsorship deck and next steps.</p>
    <p style="margin-top:24px;font-size:14px;color:#3a2419">Questions? <a href="mailto:${params.contactEmail}" style="color:#7a5c1e">${params.contactEmail}</a></p>
  </div>
</body>
</html>`.trim();

  const text = [
    `Dear ${params.contactPerson},`,
    "",
    `Thank you for your sponsorship enquiry for ${params.eventName}.`,
    `Company: ${params.company}`,
    `Package: ${params.packageName}`,
    "",
    `Our partnerships team will be in touch shortly.`,
    "",
    params.organisation,
  ].join("\n");

  return sendMail({ to: params.email, subject, html, text });
}
