import Link from "next/link";
import type { ComponentProps } from "react";

/** Temporary demo route — replace with auth-gated entry before public launch. */
export const COMMITTEE_PORTAL_HREF = "/dashboard" as const;

const base =
  "group inline-flex items-center gap-2 font-sans transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold-bright";

type Variant = "navbar-desktop" | "navbar-mobile" | "footer";

const variants: Record<Variant, string> = {
  "navbar-desktop":
    "rounded-full border border-gold/35 bg-gold/[0.08] px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-gold-light shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-gold-bright/55 hover:bg-gold/[0.14] hover:text-cream",
  "navbar-mobile":
    "w-full justify-between rounded-xl border border-gold/20 bg-gold/[0.06] px-4 py-3.5 text-lg text-cream/92 hover:bg-gold/[0.1]",
  footer:
    "rounded-full border border-gold/25 bg-white/[0.03] px-5 py-2.5 text-sm text-cream/85 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] hover:border-gold-bright/45 hover:bg-gold/[0.08] hover:text-cream",
};

function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`rounded-full border border-gold/25 bg-espresso/40 px-2 py-0.5 font-sans text-[0.58rem] font-bold uppercase tracking-[0.12em] text-gold-muted ${className}`}
    >
      Committee demo
    </span>
  );
}

type CommitteePortalLinkProps = {
  variant: Variant;
  className?: string;
  onNavigate?: () => void;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

/**
 * Temporary Committee Portal entry for stakeholder demos.
 *
 * TODO(platform-auth): Remove public nav/footer exposure before launch.
 * Protect /dashboard with Supabase Auth + RBAC middleware — see docs/PHASE_2_SPEC.md.
 */
export function CommitteePortalLink({
  variant,
  className = "",
  onNavigate,
  ...props
}: CommitteePortalLinkProps) {
  return (
    <Link
      href={COMMITTEE_PORTAL_HREF}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      onClick={onNavigate}
      {...props}
    >
      <span>Committee Portal</span>
      <DemoBadge />
    </Link>
  );
}
