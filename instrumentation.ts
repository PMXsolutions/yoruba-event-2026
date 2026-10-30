export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { getDatabaseEnvPresence } = await import("@/lib/db/connection");
  if (!getDatabaseEnvPresence().ready) return;

  try {
    const { applyDatabaseSchema } = await import("@/lib/db/schema");
    await applyDatabaseSchema();
    const { ensureCommitteeAdmin } = await import("@/lib/auth/ensure-admin");
    await ensureCommitteeAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[mssql] Startup schema or admin bootstrap failed:", message);
  }
}
