export type SendSmsResult =
  | { ok: true; sid?: string }
  | {
      ok: false;
      reason: "NOT_CONFIGURED" | "DISABLED" | "SEND_FAILED" | "MISSING_PHONE";
      message: string;
    };
