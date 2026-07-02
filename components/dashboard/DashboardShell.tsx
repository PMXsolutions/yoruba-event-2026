"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions/dashboard";
import { DASHBOARD_NAV } from "@/platform/engines/dashboard/placeholder-data";
import { SITE } from "@/lib/site";

export function DashboardShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f7f3ec] text-mahogany">
      <header className="border-b border-mahogany/10 bg-espresso text-cream">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:py-6">
          <div>
            <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.34em] text-gold-bright">
              Promax Event Platform · Committee Portal
            </p>
            <p className="mt-1 font-sans text-xs text-cream/55">{SITE.name}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-cream/70">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {actions}
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-gold/30 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition-colors hover:border-gold-bright hover:text-cream"
            >
              ← Public site
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center rounded-full border border-white/15 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-cream/70 transition-colors hover:border-red-400/40 hover:text-red-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[15rem_1fr] lg:gap-8 lg:py-8">
        <aside>
          <nav aria-label="Committee portal" className="sticky top-6 space-y-1">
            {DASHBOARD_NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${
                    active
                      ? "bg-white shadow-[var(--shadow-card-light)] ring-1 ring-gold/20"
                      : "hover:bg-white/70"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                      active
                        ? "bg-espresso text-gold-bright"
                        : "bg-mahogany/8 text-mahogany/60 group-hover:bg-mahogany/12"
                    }`}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-sans text-sm font-semibold text-mahogany">
                      {item.label}
                      {item.badge ? (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-gold-deep">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="block font-sans text-[0.72rem] text-mahogany/55">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}

export function StatGrid({ stats }: { stats: readonly { label: string; value: string; change?: string; trend?: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-mahogany/8 bg-white p-5 shadow-[var(--shadow-card-light)]"
        >
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.18em] text-mahogany/50">
            {s.label}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-mahogany">{s.value}</p>
          {s.change ? (
            <p className="mt-2 font-sans text-xs text-mahogany/55">{s.change}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function DataTable({
  title,
  columns,
  rows,
  emptyMessage,
}: {
  title: string;
  columns: readonly string[];
  rows: readonly Record<string, string>[];
  emptyMessage?: string;
}) {
  const keys = rows.length > 0 ? Object.keys(rows[0]) : columns.map((c) => c.toLowerCase());

  return (
    <section className="overflow-hidden rounded-2xl border border-mahogany/8 bg-white shadow-[var(--shadow-card-light)]">
      <div className="border-b border-mahogany/8 px-5 py-4 sm:px-6">
        <h2 className="font-display text-xl font-semibold text-mahogany">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-mahogany/8 bg-cream/50">
              {keys.map((k) => (
                <th
                  key={k}
                  className="px-5 py-3 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mahogany/50 sm:px-6"
                >
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-mahogany/5 last:border-0 hover:bg-cream/30">
                {keys.map((k) => (
                  <td key={k} className="px-5 py-3.5 text-mahogany/80 sm:px-6">
                    {row[k] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {emptyMessage ? (
        <p className="border-t border-mahogany/8 px-5 py-3 font-sans text-xs text-mahogany/50 sm:px-6">
          {emptyMessage}
        </p>
      ) : null}
    </section>
  );
}

export function IntegrationBanner({
  title,
  children,
  variant = "info",
}: {
  title: string;
  children: ReactNode;
  variant?: "info" | "warning";
}) {
  const styles =
    variant === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-sky-200 bg-sky-50 text-sky-950";
  return (
    <section className={`rounded-2xl border px-5 py-4 font-sans text-sm leading-relaxed ${styles}`}>
      <strong>{title}</strong>
      <div className="mt-2 opacity-90">{children}</div>
    </section>
  );
}

/** @deprecated Use StatGrid — kept for backward compatibility */
export function PlaceholderPanel({
  title: _title,
  items,
}: {
  title: string;
  items: readonly { label: string; value: string }[];
}) {
  return (
    <StatGrid stats={items.map((i) => ({ label: i.label, value: i.value }))} />
  );
}
