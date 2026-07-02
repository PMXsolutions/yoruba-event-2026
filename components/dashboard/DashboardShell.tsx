import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/rsvps", label: "RSVPs" },
  { href: "/dashboard/sponsors", label: "Sponsors" },
  { href: "/dashboard/volunteers", label: "Volunteers" },
  { href: "/dashboard/tasks", label: "Tasks" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream text-mahogany">
      <header className="border-b border-mahogany/10 bg-espresso text-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.32em] text-gold-bright">
              Phase 2 · Placeholder
            </p>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl font-sans text-sm text-cream/70">{description}</p>
          </div>
          <Link
            href="/"
            className="inline-flex w-fit rounded-full border border-gold/30 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-light transition-colors hover:border-gold-bright hover:text-cream"
          >
            ← Public site
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[14rem_1fr]">
        <nav
          aria-label="Dashboard navigation"
          className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-mahogany/10 bg-white/60 px-4 py-2.5 font-sans text-sm font-medium text-mahogany/80 transition-colors hover:border-gold/30 hover:bg-cream lg:border-transparent lg:bg-transparent lg:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}

export function PlaceholderPanel({
  title,
  items,
}: {
  title: string;
  items: readonly { label: string; value: string }[];
}) {
  return (
    <section className="rounded-2xl border border-mahogany/10 bg-white/80 p-6 shadow-[var(--shadow-card-light)] sm:p-8">
      <h2 className="font-display text-xl font-semibold text-mahogany">{title}</h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-mahogany/65">
        {/* TODO(phase-2): Replace placeholder data with authenticated Supabase queries. */}
        Placeholder data only. Authentication and role-based access control are required before
        connecting live data.
      </p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-mahogany/8 bg-cream/50 px-4 py-3"
          >
            <dt className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-mahogany/50">
              {item.label}
            </dt>
            <dd className="mt-1 font-sans text-lg font-semibold text-mahogany">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
