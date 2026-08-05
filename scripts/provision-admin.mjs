#!/usr/bin/env node
/**
 * Provision the initial SUPER_ADMIN for Promax Event Platform.
 *
 * Usage (with env loaded):
 *   node --env-file=.env.local scripts/provision-admin.mjs
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_PASSWORD
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
const password = process.env.ADMIN_PASSWORD?.trim();
const fullName = (process.env.ADMIN_FULL_NAME || "Platform Administrator").trim();

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!password || password.length < 12) {
  console.error("Set ADMIN_PASSWORD to a strong password (min 12 characters).");
  process.exit(1);
}

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
    process.exit(1);
  }

  console.info("SUPER_ADMIN profile ready for", email);
  console.info("Sign in at /login — do not share or commit the password.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
