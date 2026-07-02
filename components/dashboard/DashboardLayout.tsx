"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DASHBOARD_NAV } from "@/platform/engines/dashboard/placeholder-data";
import { SITE } from "@/lib/site";
import { getDashboardPageMeta } from "@/components/dashboard/page-config";

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 2.25a4.5 4.5 0 00-4.5 4.5v2.25l-1.125 2.25h11.25L13.5 9V6.75A4.5 4.5 0 009 2.25z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M7.5 15.75a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3 5h12M3 9h12M3 13h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.5" y="3" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 3v12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = getDashboardPageMeta(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="dashboard-root min-h-screen bg-cream-warm font-sans text-mahogany">
      {/* Mobile overlay */}
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-espresso/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`dashboard-sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gold/10 bg-espresso text-cream transition-[width,transform] duration-300 ease-out lg:relative lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          } ${sidebarCollapsed ? "w-[4.5rem]" : "w-64"}`}
        >
          {/* Brand */}
          <div
            className={`flex h-16 shrink-0 items-center border-b border-gold/10 ${
              sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
            }`}
          >
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-cream">Yoruba Day</p>
                <p className="truncate font-sans text-[0.58rem] font-bold uppercase tracking-[0.28em] text-gold-muted">
                  Committee Portal
                </p>
              </div>
            ) : (
              <span className="font-display text-lg font-semibold text-gold-bright" aria-hidden>
                Y
              </span>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="hidden rounded-lg border border-gold/15 p-2 text-gold-light transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-cream lg:inline-flex"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelIcon />
            </button>
          </div>

          {/* Nav */}
          <nav
            aria-label="Committee portal"
            className="flex-1 space-y-1 overflow-y-auto px-2 py-4"
          >
            {DASHBOARD_NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileNav}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    active
                      ? "bg-gold/15 text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-gold/25"
                      : "text-cream/65 hover:bg-white/5 hover:text-cream"
                  } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                      active
                        ? "bg-gold/20 text-gold-bright"
                        : "bg-white/5 text-cream/50 group-hover:bg-white/8 group-hover:text-cream/80"
                    }`}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed ? (
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-sans text-sm font-semibold">
                        {item.label}
                        {item.badge ? (
                          <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-gold-light">
                            {item.badge}
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate font-sans text-[0.68rem] text-cream/45">
                        {item.description}
                      </span>
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div
            className={`shrink-0 border-t border-gold/10 p-3 ${
              sidebarCollapsed ? "flex justify-center" : ""
            }`}
          >
            <Link
              href="/"
              onClick={closeMobileNav}
              className={`inline-flex items-center gap-2 rounded-xl border border-gold/20 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-gold-light transition-colors hover:border-gold-bright/40 hover:bg-gold/10 hover:text-cream ${
                sidebarCollapsed ? "p-2.5" : "w-full justify-center px-3 py-2.5"
              }`}
            >
              {sidebarCollapsed ? "←" : "← Public site"}
            </Link>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top header */}
          <header className="sticky top-0 z-20 border-b border-mahogany/8 bg-white/90 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-lg border border-mahogany/10 p-2 text-mahogany/70 transition-colors hover:bg-cream hover:text-mahogany lg:hidden"
                aria-label="Open navigation"
              >
                <MenuIcon />
              </button>

              {/* Search */}
              <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-xs lg:max-w-md">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mahogany/35">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  placeholder="Search portal…"
                  className="w-full rounded-xl border border-mahogany/10 bg-cream/40 py-2.5 pl-10 pr-4 font-sans text-sm text-mahogany outline-none transition-all placeholder:text-mahogany/35 focus:border-gold/40 focus:bg-white focus:ring-2 focus:ring-gold/15"
                  aria-label="Search dashboard"
                />
              </div>

              <span className="hidden shrink-0 rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1.5 font-sans text-[0.62rem] font-bold uppercase tracking-[0.12em] text-gold-deep lg:inline-flex">
                {SITE.name}
              </span>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  className="relative rounded-xl border border-mahogany/10 p-2.5 text-mahogany/70 transition-colors hover:border-gold/25 hover:bg-cream hover:text-mahogany"
                  aria-label="Notifications"
                >
                  <BellIcon />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold-bright ring-2 ring-white" />
                </button>

                <div className="hidden h-8 w-px bg-mahogany/10 sm:block" aria-hidden />

                <div className="flex items-center gap-2.5 rounded-xl border border-mahogany/8 bg-cream/30 py-1.5 pl-1.5 pr-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-espresso font-sans text-xs font-bold text-gold-bright">
                    CM
                  </span>
                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate font-sans text-xs font-semibold text-mahogany">
                      Committee Member
                    </p>
                    <p className="truncate font-sans text-[0.65rem] text-mahogany/50">
                      {SITE.presenter}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Breadcrumbs + page header */}
          <div className="border-b border-mahogany/6 bg-cream/60 px-4 py-5 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5">
              <Link
                href="/dashboard"
                className="font-sans text-xs font-medium text-mahogany/45 transition-colors hover:text-gold-deep"
              >
                Portal
              </Link>
              {meta.breadcrumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                  <ChevronIcon className="text-mahogany/25" />
                  {crumb.href && i < meta.breadcrumbs.length - 1 ? (
                    <Link
                      href={crumb.href}
                      className="font-sans text-xs font-medium text-mahogany/45 transition-colors hover:text-gold-deep"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-sans text-xs font-semibold text-mahogany/70">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.32em] text-gold-muted">
                  Promax Event Platform · Event Command Centre
                </p>
                <h1 className="mt-1 font-display text-2xl font-semibold text-mahogany sm:text-3xl">
                  {meta.title}
                </h1>
                <p className="mt-2 max-w-3xl font-sans text-sm leading-relaxed text-mahogany/60">
                  {meta.description}
                </p>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="dashboard-content-grid flex-1 bg-cream-warm px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

/** Optional slot for page-level actions rendered above main content. */
export function DashboardPageActions({ children }: { children: ReactNode }) {
  return <div className="-mt-2 mb-2 flex flex-wrap gap-3">{children}</div>;
}
