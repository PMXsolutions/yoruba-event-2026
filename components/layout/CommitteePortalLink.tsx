import Link from "next/link";
import type { ComponentProps } from "react";

/** Auth-gated committee entry — redirects to login when not signed in. */
export const COMMITTEE_PORTAL_HREF = "/login" as const;

const base =
  "group inline-flex items-center gap-2 font-sans transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold-bright";

type Variant = "navbar-desktop" | "navbar-mobile" | "footer";

/** Discreet production styling — authorised committee access, not a primary CTA. */
const variants: Record<Variant, string> = {
  "navbar-desktop":
    "rounded-full border border-white/10 bg-transparent px-3 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-cream/55 hover:border-gold/30 hover:text-cream/85",
  "navbar-mobile":
    "w-full justify-between rounded-xl border border-white/10 bg-transparent px-4 py-3 text-base text-cream/70 hover:bg-white/[0.04]",
  footer:
    "rounded-full border border-white/10 bg-transparent px-4 py-2 text-xs text-cream/55 hover:border-gold/25 hover:text-cream/80",
};

type CommitteePortalLinkProps = {
  variant: Variant;
  className?: string;
  onNavigate?: () => void;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

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
      title="Authorised committee access"
      {...props}
    >
      <span>Committee Portal</span>
    </Link>
  );
}
