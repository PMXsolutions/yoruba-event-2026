import { NextResponse } from "next/server";
import { getDatabaseEnvPresence, missingDatabaseEnvVarNames } from "@/lib/db/connection";
import { errorMessage, isDatabaseConnectivityFailure } from "@/lib/db/connectivity";
import { dbQuery } from "@/lib/db/query";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import { getActiveEventConfig } from "@/platform/core/config/active-event";

export const dynamic = "force-dynamic";

type HealthOk = {
  status: "ok";
  database: true;
  /** Compatibility alias: true when SQL Server answered, not when Supabase is in use. */
  supabase: true;
  env: true;
  authConfigured: boolean;
  event: string;
  emailConfigured: boolean;
  emailTransport: "smtp" | "resend" | "none";
  emailConfirmationsEnabled: boolean;
  emailFromDomain: string | null;
  smtpHost: string | null;
  rsvpCommsColumns?: boolean;
};

type HealthError = {
  status: "error";
  database: boolean;
  supabase: boolean;
  env: boolean;
  authConfigured?: boolean;
  code: string;
  missingEnvVars?: string[];
  event?: string;
  emailConfigured?: boolean;
  emailTransport?: "smtp" | "resend" | "none";
  emailConfirmationsEnabled?: boolean;
  emailFromDomain?: string | null;
  smtpHost?: string | null;
};

export async function GET(): Promise<NextResponse<HealthOk | HealthError>> {
  const presence = getDatabaseEnvPresence();
  const email = getEmailEnvPresence();
  const emailDiag = {
    emailConfigured: email.ready,
    emailTransport: email.transport,
    emailConfirmationsEnabled: email.diagnostics.emailConfirmationsEnabled,
    emailFromDomain: email.diagnostics.fromDomain,
    smtpHost: email.diagnostics.smtpHost,
  };

  let eventSlug = "unknown";
  try {
    eventSlug = getActiveEventConfig().slug;
  } catch {
    return NextResponse.json(
      {
        status: "error",
        database: false,
        supabase: false,
        env: presence.ready,
        authConfigured: presence.authReady,
        code: "EVENT_CONFIG_MISSING",
        ...emailDiag,
      },
      { status: 503 },
    );
  }

  if (!presence.ready) {
    const missing = missingDatabaseEnvVarNames();
    console.error("[api/health] SQL Server environment variables missing (names only):", missing.join(", ") || "(unknown)");
    return NextResponse.json(
      {
        status: "error",
        database: false,
        supabase: false,
        env: false,
        authConfigured: presence.authReady,
        code: "MISSING_ENV_VARS",
        missingEnvVars: missing,
        event: eventSlug,
        ...emailDiag,
      },
      { status: 503 },
    );
  }

  try {
    const columns = await dbQuery<{ COLUMN_NAME: string }>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = N'rsvps'`,
    );
    if (columns.length === 0) {
      console.error("[api/health] rsvps table is missing. Apply sql/mssql/001_create_and_migrate.sql.");
      return NextResponse.json(
        {
          status: "error",
          database: false,
          supabase: false,
          env: true,
          authConfigured: presence.authReady,
          code: "RSVPS_TABLE_MISSING",
          event: eventSlug,
          ...emailDiag,
        },
        { status: 503 },
      );
    }
    const names = new Set(columns.map((column) => column.COLUMN_NAME.toLowerCase()));
    const commsReady = ["email_consent", "sms_consent", "email_status", "sms_status"].every((name) => names.has(name));
    console.info(
      "[api/health] OK — event=",
      eventSlug,
      "database=",
      presence.database,
      "emailConfigured=",
      emailDiag.emailConfigured,
      "authConfigured=",
      presence.authReady,
    );
    return NextResponse.json({
      status: "ok",
      database: true,
      supabase: true,
      env: true,
      authConfigured: presence.authReady,
      event: eventSlug,
      rsvpCommsColumns: commsReady,
      ...emailDiag,
    });
  } catch (error) {
    const message = errorMessage(error);
    const unreachable = isDatabaseConnectivityFailure(message);
    console.error("[api/health] SQL Server connection error:", message);
    return NextResponse.json(
      {
        status: "error",
        database: false,
        supabase: false,
        env: true,
        authConfigured: presence.authReady,
        code: unreachable ? "DATABASE_CONNECTION_FAILED" : "DATABASE_QUERY_FAILED",
        event: eventSlug,
        ...emailDiag,
      },
      { status: 503 },
    );
  }
}
