import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";

const base =
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-8 py-3.5 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] transition-[transform,box-shadow,filter] duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold-bright disabled:pointer-events-none disabled:opacity-50 sm:px-10 sm:py-4 sm:text-[0.85rem]";

const variants: Record<Variant, string> = {
  primary:
    "border border-gold-bright/45 bg-gradient-to-br from-gold-bright via-gold to-gold-deep text-espresso shadow-[0_4px_0_0_rgba(122,92,30,0.55),0_20px_50px_-12px_rgba(201,162,39,0.55),0_0_60px_-20px_rgba(228,199,106,0.35)] ring-1 ring-white/30 hover:-translate-y-1 hover:shadow-[0_6px_0_0_rgba(122,92,30,0.45),0_28px_64px_-8px_rgba(201,162,39,0.65),0_0_80px_-12px_rgba(228,199,106,0.45)] active:translate-y-0 active:shadow-[0_2px_0_0_rgba(122,92,30,0.6),0_12px_32px_-8px_rgba(201,162,39,0.45)]",
  outline:
    "border border-gold/40 bg-white/[0.04] text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md ring-1 ring-white/10 hover:border-gold-bright/55 hover:bg-gold/[0.1] hover:shadow-[0_0_48px_-12px_rgba(201,162,39,0.3)] hover:-translate-y-0.5 active:translate-y-0",
  ghost:
    "border border-transparent text-gold-light hover:bg-white/[0.05] hover:text-cream",
};

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  ...props
}: BaseProps & Omit<ComponentProps<typeof Link>, "className">) {
  const isPrimary = variant === "primary";
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {isPrimary ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        >
          <span
            className="absolute inset-0 animate-bg-shimmer bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.45)_50%,transparent_70%)]"
            style={{ backgroundSize: "200% 100%", backgroundPosition: "-100% center" }}
          />
        </span>
      ) : null}
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: BaseProps & ComponentProps<"button">) {
  const isPrimary = variant === "primary";
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {isPrimary ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        >
          <span
            className="absolute inset-0 animate-bg-shimmer bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.4)_50%,transparent_70%)]"
            style={{ backgroundSize: "200% 100%", backgroundPosition: "-100% center" }}
          />
        </span>
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
