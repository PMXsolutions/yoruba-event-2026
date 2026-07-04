import { SITE } from "@/lib/site";
import { CommitteePortalLink } from "@/components/layout/CommitteePortalLink";

const social = [
  { label: "Instagram" },
  { label: "Facebook" },
  { label: "X" },
  { label: "YouTube" },
] as const;

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative overflow-hidden border-t border-gold/12 bg-gradient-to-b from-mahogany via-espresso to-[#0a0504]"
    >
      <div className="pointer-events-none absolute inset-0 bg-motif-geo opacity-[0.06]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(201,162,39,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <p className="mb-10 max-w-2xl border-l-2 border-gold-bright/50 pl-5 font-sans text-[0.72rem] font-semibold uppercase leading-relaxed tracking-[0.28em] text-gold-bright sm:mb-12 sm:text-xs sm:tracking-[0.32em]">
          Presented by {SITE.presenter}
        </p>

        <div className="grid gap-14 md:grid-cols-[1.15fr_1fr] md:gap-20">
          <div>
            <p className="font-display text-[clamp(1.75rem,3vw,2.35rem)] font-semibold leading-tight text-cream">
              {SITE.name}
            </p>
            <p className="mt-5 max-w-md font-sans text-sm leading-[1.75] text-cream/65 sm:text-base">
              A refined, welcoming space for Yoruba families and friends of the culture. For
              partnerships, press, and general enquiries, we would love to hear from you.
            </p>
            <div className="mt-8 flex flex-col gap-2 font-sans text-sm text-cream/85 sm:text-base">
              <span className="text-cream/50">Email</span>
              <a
                href={`mailto:${SITE.contactEmail}`}
                className="w-fit break-all text-gold-light transition-colors hover:text-gold-bright"
              >
                {SITE.contactEmail}
              </a>
              <span className="mt-3 text-cream/50">Phone</span>
              <span className="text-cream/75">To be confirmed</span>
            </div>
          </div>
          <div className="flex flex-col gap-10 sm:flex-row sm:justify-end md:flex-col md:items-end">
            <div className="w-full sm:text-right">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.32em] text-gold-bright">
                Committee
              </p>
              <div className="mt-5 flex flex-col items-start gap-3 sm:items-end">
                {/* TODO(platform-auth): Remove public link before launch; gate /dashboard with Supabase Auth. */}
                <CommitteePortalLink variant="footer" />
                <p className="max-w-xs font-sans text-xs leading-relaxed text-cream/40">
                  Demo access for planning committee preview. Authentication required before
                  public launch.
                </p>
              </div>
            </div>
            <div>
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.32em] text-gold-bright">
                Follow
              </p>
              <ul className="mt-5 flex flex-wrap gap-2.5 sm:justify-end" aria-label="Social channels coming soon">
                {social.map((s) => (
                  <li key={s.label}>
                    <span
                      aria-label={`${s.label} — coming soon`}
                      className="inline-flex cursor-not-allowed rounded-full border border-gold/15 bg-white/[0.02] px-5 py-2.5 font-sans text-sm text-cream/45 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]"
                      title={`${s.label} — coming soon`}
                    >
                      {s.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="max-w-xs text-left font-sans text-xs leading-relaxed text-cream/40 sm:text-right">
              Social links will be updated as official channels go live.
            </p>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-5 border-t border-white/[0.07] pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs text-cream/45">
            © {new Date().getFullYear()} Yoruba Day Canberra · {SITE.presenter}
          </p>
          <a
            href="#home"
            className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-gold-muted transition-colors hover:text-gold-bright"
          >
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
