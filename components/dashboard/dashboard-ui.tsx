import type { ReactNode } from "react";

/* ─── Status Badge ─── */
const STATUS_STYLES: Record<string, string> = {
  Confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  New: "bg-sky-50 text-sky-800 ring-sky-200/60",
  Contacted: "bg-violet-50 text-violet-800 ring-violet-200/60",
  Published: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  Done: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  done: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  Prospect: "bg-sky-50 text-sky-800 ring-sky-200/60",
  Draft: "bg-amber-50 text-amber-900 ring-amber-200/60",
  Planned: "bg-violet-50 text-violet-800 ring-violet-200/60",
  Open: "bg-cream text-mahogany/70 ring-mahogany/10",
  Available: "bg-cream text-mahogany/70 ring-mahogany/10",
  Pending: "bg-amber-50 text-amber-900 ring-amber-200/60",
  "In progress": "bg-sky-50 text-sky-800 ring-sky-200/60",
  "In discussion": "bg-sky-50 text-sky-800 ring-sky-200/60",
  Review: "bg-violet-50 text-violet-800 ring-violet-200/60",
  "To do": "bg-cream text-mahogany/60 ring-mahogany/10",
  Blocked: "bg-red-50 text-red-800 ring-red-200/60",
  Critical: "bg-red-50 text-red-800 ring-red-200/60",
  High: "bg-orange-50 text-orange-900 ring-orange-200/60",
  Medium: "bg-amber-50 text-amber-900 ring-amber-200/60",
  upcoming: "bg-sky-50 text-sky-800 ring-sky-200/60",
  "at-risk": "bg-red-50 text-red-800 ring-red-200/60",
  Configured: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  Ready: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  "Deployment ready": "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  "Not configured": "bg-cream text-mahogany/55 ring-mahogany/10",
  "Missing vars": "bg-amber-50 text-amber-900 ring-amber-200/60",
  "Missing FROM": "bg-amber-50 text-amber-900 ring-amber-200/60",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-cream text-mahogany/65 ring-mahogany/10";
  return (
    <span
      className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}

/* ─── Section Header ─── */
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold text-mahogany sm:text-xl">{title}</h2>
        {description ? (
          <p className="mt-1 font-sans text-sm text-mahogany/55">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ─── Column label helper ─── */
function formatColumnLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\bFollow up\b/i, "Follow-up")
    .replace(/\bId\b/, "ID");
}

/* ─── Page Toolbar ─── */
export function PageToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-mahogany/[0.06] bg-white px-3 py-3 shadow-sm sm:px-4">
      {children}
    </div>
  );
}

export function ToolbarButton({
  children,
  disabled,
  primary,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  primary?: boolean;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all";
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${base} cursor-not-allowed border border-mahogany/8 bg-cream/50 text-mahogany/35`}
      >
        {children}
      </span>
    );
  }
  if (primary) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${base} border border-gold/30 bg-espresso text-gold-light hover:bg-mahogany disabled:cursor-not-allowed disabled:opacity-45`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} border border-mahogany/10 bg-white text-mahogany/75 hover:border-gold/25 hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {children}
    </button>
  );
}

export function ToolbarSearch({ placeholder = "Filter records…" }: { placeholder?: string }) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      className="w-full min-w-0 basis-full rounded-lg border border-mahogany/10 bg-cream/30 px-3 py-2 font-sans text-sm text-mahogany outline-none placeholder:text-mahogany/35 focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10 sm:basis-auto sm:min-w-[12rem] sm:flex-1"
      aria-label="Filter"
    />
  );
}

/* ─── Stat Card ─── */
export function StatGrid({
  stats,
  columns = 4,
}: {
  stats: readonly { label: string; value: string; change?: string; trend?: string; icon?: string }[];
  columns?: 2 | 3 | 4 | 6;
}) {
  const colClass =
    columns === 6
      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : columns === 2
          ? "sm:grid-cols-2"
          : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={`grid gap-4 ${colClass}`}>
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  change,
  trend,
  icon,
}: {
  label: string;
  value: string;
  change?: string;
  trend?: string;
  icon?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-mahogany/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(36,21,15,0.04),0_8px_24px_-8px_rgba(36,21,15,0.08)] transition-all hover:border-gold/15 hover:shadow-[0_12px_32px_-12px_rgba(201,162,39,0.15)]">
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gold/[0.04] transition-transform group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-sans text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mahogany/45">
          {label}
        </p>
        {icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream/80 text-sm text-gold-deep ring-1 ring-mahogany/[0.04]">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="relative mt-3 truncate font-display text-[1.75rem] font-semibold leading-none text-mahogany sm:text-[2rem]">
        {value}
      </p>
      {change ? (
        <p className="relative mt-2 truncate font-sans text-xs text-mahogany/50">
          {trend === "up" ? <span className="mr-1 text-emerald-600">↑</span> : null}
          {change}
        </p>
      ) : null}
    </div>
  );
}

/* ─── Dashboard Card ─── */
export function DashboardCard({
  title,
  description,
  children,
  className = "",
  headerAction,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-mahogany/[0.06] bg-white shadow-[0_1px_2px_rgba(36,21,15,0.04),0_8px_24px_-8px_rgba(36,21,15,0.08)] ${className}`}
    >
      {title ? (
        <div className="flex items-start justify-between gap-4 border-b border-mahogany/[0.05] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-mahogany">{title}</h2>
            {description ? (
              <p className="mt-0.5 font-sans text-xs text-mahogany/50">{description}</p>
            ) : null}
          </div>
          {headerAction}
        </div>
      ) : null}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

/* ─── Progress Bar ─── */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="min-w-[5rem]">
      {label ? (
        <p className="mb-1 font-sans text-[0.65rem] font-medium text-mahogany/45">{label}</p>
      ) : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-cream">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-bright transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Enterprise Data Table ─── */
const BADGE_COLUMNS = new Set(["status", "priority", "tier"]);

export function DataTable({
  title,
  description,
  columns,
  rows,
  emptyMessage,
  toolbar,
}: {
  title: string;
  description?: string;
  columns: readonly string[];
  rows: readonly Record<string, string>[];
  emptyMessage?: string;
  toolbar?: ReactNode;
}) {
  const keys = rows.length > 0 ? Object.keys(rows[0]) : columns.map((c) => c.toLowerCase().replace(/\s+/g, ""));

  return (
    <section className="overflow-hidden rounded-2xl border border-mahogany/[0.06] bg-white shadow-[0_1px_2px_rgba(36,21,15,0.04),0_8px_24px_-8px_rgba(36,21,15,0.08)]">
      <div className="border-b border-mahogany/[0.05] px-5 py-4 sm:px-6">
        <SectionHeader title={title} description={description} />
        {toolbar ? <div className="mt-4">{toolbar}</div> : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No records yet" message={emptyMessage ?? "Data will appear here once connected."} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[40rem] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-mahogany/[0.05] bg-cream/40">
                  {keys.map((k) => (
                    <th
                      key={k}
                      scope="col"
                      className="px-5 py-3.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-mahogany/45 sm:px-6"
                    >
                      {formatColumnLabel(k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-mahogany/[0.04]">
                {rows.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-cream/30">
                    {keys.map((k) => (
                      <td key={k} className="max-w-[14rem] px-5 py-4 sm:px-6">
                        {k === "progress" ? (
                          <ProgressBar value={Number(row[k]) || 0} />
                        ) : BADGE_COLUMNS.has(k) ? (
                          <StatusBadge status={row[k] ?? "—"} />
                        ) : k === "email" ? (
                          <span className="block truncate text-mahogany/75" title={row[k]}>
                            {row[k] ?? "—"}
                          </span>
                        ) : (
                          <span className="block truncate text-mahogany/80">{row[k] ?? "—"}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-4 md:hidden">
            {rows.map((row, i) => (
              <div
                key={i}
                className="rounded-xl border border-mahogany/[0.06] bg-cream/20 p-4 space-y-2"
              >
                {keys.map((k) => (
                  <div key={k} className="flex items-start justify-between gap-3">
                    <span className="shrink-0 font-sans text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/40">
                      {formatColumnLabel(k)}
                    </span>
                    <span className="min-w-0 text-right font-sans text-sm text-mahogany/80">
                      {BADGE_COLUMNS.has(k) ? <StatusBadge status={row[k] ?? "—"} /> : (
                        <span className="block truncate">{row[k] ?? "—"}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {emptyMessage && rows.length > 0 ? (
        <p className="border-t border-mahogany/[0.05] px-5 py-3 font-sans text-xs text-mahogany/45 sm:px-6">
          {emptyMessage}
        </p>
      ) : null}
    </section>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream ring-1 ring-mahogany/[0.06]">
        <span className="font-display text-2xl text-gold-muted">—</span>
      </div>
      <p className="mt-4 font-display text-lg font-semibold text-mahogany">{title}</p>
      <p className="mt-2 max-w-sm font-sans text-sm leading-relaxed text-mahogany/50">{message}</p>
    </div>
  );
}

/* ─── Integration Banner ─── */
export function IntegrationBanner({
  title,
  children,
  variant = "info",
}: {
  title: string;
  children: ReactNode;
  variant?: "info" | "warning" | "success";
}) {
  const styles = {
    info: "border-sky-200/70 bg-gradient-to-r from-sky-50 to-white text-sky-950",
    warning: "border-amber-200/70 bg-gradient-to-r from-amber-50 to-white text-amber-950",
    success: "border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-white text-emerald-950",
  }[variant];

  return (
    <section className={`rounded-2xl border px-5 py-4 font-sans text-sm leading-relaxed shadow-sm ${styles}`}>
      <strong className="font-semibold">{title}</strong>
      <div className="mt-1.5 opacity-90 [&_code]:rounded [&_code]:bg-black/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.8em]">
        {children}
      </div>
    </section>
  );
}

/* ─── Integration Status Row ─── */
export function IntegrationStatus({
  items,
}: {
  items: readonly { name: string; status: string; ok: boolean; detail?: string }[];
}) {
  return (
    <dl className="divide-y divide-mahogany/[0.05]">
      {items.map((item) => (
        <div key={item.name} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
          <dt className="font-sans text-sm font-medium text-mahogany/60">{item.name}</dt>
          <dd className="flex min-w-0 flex-col items-start gap-1 sm:max-w-[55%] sm:items-end">
            <StatusBadge status={item.status} />
            {item.detail ? (
              <span
                className="max-w-full text-left font-sans text-xs leading-snug text-mahogany/45 sm:text-right"
                title={item.detail}
              >
                {item.detail}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ─── Activity Feed ─── */
const ACTIVITY_ICONS: Record<string, string> = {
  rsvp: "✉",
  sponsor: "★",
  volunteer: "◎",
  programme: "♪",
  announcement: "📣",
  task: "☑",
};

export function ActivityFeed({
  items,
}: {
  items: readonly { id: string; title: string; detail: string; time: string; type: string }[];
}) {
  return (
    <ul className="divide-y divide-mahogany/[0.05]">
      {items.map((item) => (
        <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-sm ring-1 ring-mahogany/[0.05]">
            {ACTIVITY_ICONS[item.type] ?? "·"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-sm font-semibold text-mahogany">{item.title}</p>
            <p className="mt-0.5 truncate font-sans text-xs text-mahogany/50">{item.detail}</p>
          </div>
          <time className="shrink-0 font-sans text-[0.65rem] font-medium text-mahogany/40">
            {item.time}
          </time>
        </li>
      ))}
    </ul>
  );
}

/* ─── Milestones ─── */
export function MilestoneList({
  items,
}: {
  items: readonly { title: string; date: string; status: string }[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li
          key={m.title}
          className="flex items-center justify-between gap-3 rounded-xl border border-mahogany/[0.05] bg-cream/20 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate font-sans text-sm font-medium text-mahogany">{m.title}</p>
            <p className="font-sans text-xs text-mahogany/45">{m.date}</p>
          </div>
          <StatusBadge status={m.status} />
        </li>
      ))}
    </ul>
  );
}

/* ─── Pipeline Cards ─── */
export function PipelineCards({
  items,
}: {
  items: readonly { label: string; count: number; subtitle?: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-mahogany/[0.06] bg-gradient-to-br from-white to-cream/40 p-4"
        >
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/45">
            {item.label}
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-mahogany">{item.count}</p>
          {item.subtitle ? (
            <p className="mt-1 font-sans text-xs text-mahogany/45">{item.subtitle}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ─── Charts ─── */
export function BarChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: readonly { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <DashboardCard title={title} description={subtitle}>
      <div className="flex h-52 items-end justify-between gap-2 sm:gap-4">
        {data.map((d) => {
          const height = `${Math.max(4, Math.round((d.value / max) * 100))}%`;
          return (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="font-sans text-[0.65rem] font-semibold text-mahogany/50">
                {d.value.toLocaleString()}
              </span>
              <div className="flex h-40 w-full items-end justify-center">
                <div
                  className="w-full max-w-14 rounded-t-lg shadow-sm transition-all hover:opacity-90"
                  style={{
                    height,
                    background: d.color ?? "linear-gradient(to top, #7a5c1e, #e4c76a)",
                  }}
                />
              </div>
              <span className="w-full truncate text-center font-sans text-[0.62rem] font-medium text-mahogany/50">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

export function TrendChart({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle?: string;
  points: readonly number[];
}) {
  const width = 400;
  const height = 140;
  const padding = 12;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((p - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1]?.x ?? 0},${height - padding} L${coords[0]?.x ?? 0},${height - padding} Z`;

  return (
    <DashboardCard title={title} description={subtitle}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label={title}>
        <defs>
          <linearGradient id="enterprise-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a227" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={padding}
            x2={width - padding}
            y1={padding + pct * (height - padding * 2)}
            y2={padding + pct * (height - padding * 2)}
            stroke="#3a2419"
            strokeOpacity="0.06"
          />
        ))}
        <path d={areaPath} fill="url(#enterprise-trend-fill)" />
        <path d={linePath} fill="none" stroke="#c9a227" strokeWidth="2.5" strokeLinecap="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="4" fill="#fff" stroke="#7a5c1e" strokeWidth="2" />
        ))}
      </svg>
    </DashboardCard>
  );
}
