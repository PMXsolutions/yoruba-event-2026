#!/usr/bin/env node
/**
 * Verify a deployed Promax Event Platform instance.
 *
 * Usage:
 *   npm run verify:deployment
 *   DEPLOYMENT_URL=https://yoruba-event-2026.vercel.app node scripts/verify-deployment.mjs
 */

const base = (process.env.DEPLOYMENT_URL || "https://yoruba-event-2026.vercel.app").replace(
  /\/$/,
  "",
);

async function getJson(path) {
  const res = await fetch(`${base}${path}`, { redirect: "follow" });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, json, text: text.slice(0, 200) };
}

async function main() {
  console.info("Verifying", base);
  const checks = [];

  for (const path of ["/", "/login", "/api/health"]) {
    const result = await getJson(path);
    const ok =
      path === "/api/health"
        ? result.status === 200 && result.json?.status === "ok"
        : result.status >= 200 && result.status < 400;
    checks.push({ path, ok, status: result.status, detail: result.json ?? result.text });
    console.info(ok ? "OK " : "FAIL", path, result.status, JSON.stringify(result.json ?? result.text));
  }

  const health = checks.find((c) => c.path === "/api/health");
  if (health?.detail && typeof health.detail === "object") {
    const d = health.detail;
    if (d.missingEnvVars?.length) {
      console.error("\nMissing env on deployment:", d.missingEnvVars.join(", "));
      console.error("Set these in Vercel Production env, then Redeploy.");
    }
    if (d.emailConfigured === false) {
      console.error("Email not configured — set MAIL_FROM + SMTP_* (or Resend) on Vercel.");
    }
    if (d.authConfigured === false) {
      console.error("Auth not fully configured — set NEXT_PUBLIC_SUPABASE_ANON_KEY and redeploy.");
    }
  }

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.error(`\n${failed.length} check(s) failed. See docs/PRODUCTION_CHECKLIST.md`);
    process.exit(1);
  }
  console.info("\nAll checks passed.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
