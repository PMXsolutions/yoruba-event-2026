/** Maps Supabase / Postgres errors to warm, user-facing RSVP messages. */

export type RsvpErrorCode =
  | "VALIDATION_FAILED"
  | "MISSING_CONFIG"
  | "TABLE_MISSING"
  | "DUPLICATE"
  | "CONSTRAINT"
  | "NETWORK"
  | "UNKNOWN";

export function mapSupabaseRsvpError(message: string, code?: string): {
  userMessage: string;
  errorCode: RsvpErrorCode;
} {
  if (code === "42P01" || /relation|does not exist|schema cache|PGRST205/i.test(message)) {
    return {
      userMessage:
        "Registration is temporarily unavailable while we finalise setup. Please try again shortly or email the organisers.",
      errorCode: "TABLE_MISSING",
    };
  }
  if (/duplicate|unique/i.test(message)) {
    return {
      userMessage:
        "We already have a recent registration with this email. If you need to change details, please contact us.",
      errorCode: "DUPLICATE",
    };
  }
  if (/violates|constraint|check/i.test(message)) {
    return {
      userMessage:
        "Your submission could not be saved. Please check your answers and try again.",
      errorCode: "CONSTRAINT",
    };
  }
  return {
    userMessage:
      "Something went wrong while saving your registration. Please try again in a moment.",
    errorCode: "UNKNOWN",
  };
}

export function mapConfigError(message: string): {
  userMessage: string;
  errorCode: RsvpErrorCode;
} {
  if (message.includes("Missing NEXT_PUBLIC_SUPABASE") || message.includes("SUPABASE_SERVICE_ROLE")) {
    return {
      userMessage:
        "Registration is not configured on this deployment yet. Please try again later or contact the organisers by email.",
      errorCode: "MISSING_CONFIG",
    };
  }
  return {
    userMessage: "We could not reach our servers. Check your connection and try again.",
    errorCode: "NETWORK",
  };
}
