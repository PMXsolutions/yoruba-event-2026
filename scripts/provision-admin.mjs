#!/usr/bin/env node
/**
 * Provision the initial SUPER_ADMIN for Promax Event Platform.
 *
 * Usage:
 *   npm run provision-admin
 *   # or
 *   node --env-file=.env.local scripts/provision-admin.mjs
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_PASSWORD (min 12 characters — set in .env.local / Vercel only)
 *
 * Optional:
 *   ADMIN_EMAIL (default admin@promaxevent.com)
 *   ADMIN_FULL_NAME
 *
 * Never commit passwords. Rotate any password that was previously shared.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const email = (process.env.ADMIN_EMAIL || "admin@promaxevent.com").trim().toLowerCase();
const fullName = (process.env.ADMIN_FULL_NAME || "Platform Administrator").trim();

function resolvePassword() {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  if (fromEnv && fromEnv.length >= 12) return { password: fromEnv, source: "ADMIN_PASSWORD" };
  return null;
}

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Fill Supabase keys in .env.local (or Vercel), then re-run:");
  console.error("  npm run provision-admin");
  process.exit(1);
}

const resolved = resolvePassword();
if (!resolved) {
  console.error("Set ADMIN_PASSWORD to a strong password (min 12 characters) in .env.local.");
  console.error('Example: ADMIN_PASSWORD="your-strong-password-here"');
  process.exit(1);
}

const { password, source } = resolved;

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url.replace(/\/rest\/v1\/?$/, ""), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  const existing = listed.users.find((u) => u.email?.toLowerCase() === email);
  let userId = existing?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "SUPER_ADMIN" },
    });
    if (error || !data.user) {
      console.error("Failed to create user:", error?.message || "unknown");
      process.exit(1);
    }
    userId = data.user.id;
    console.info("Created auth user:", email);
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "SUPER_ADMIN" },
    });
    if (error) {
      console.error("Failed to update user:", error.message);
      process.exit(1);
    }
    console.info("Updated existing auth user:", email);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role: "SUPER_ADMIN",
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("Failed to upsert profile:", profileError.message);
    console.error("Ensure migration 20260805100000_platform_production.sql has been applied.");
    process.exit(1);
  }

  console.info("SUPER_ADMIN profile ready for", email);
  console.info("Password source:", source);
  console.info("Sign in at /login with:");
  console.info("  Email:", email);
  console.info("  Password: (value from", source + " — not printed)");
  console.info("Do not commit passwords. Rotate after first production login.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
