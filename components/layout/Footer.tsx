import Link from "next/link";
import { SITE, SOCIAL_LINKS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-gold/12 bg-gradient-to-b from-mahogany via-espresso to-[#0a0504]">
      <div className="pointer-events-none absolute inset-0 bg-motif-geo opacity-[0.06]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:gap-16">
          <div>
            <p className="font-display text-2xl font-semibold text-cream">{SITE.name}</p>
            <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-cream/60">
              A refined, welcoming space for Yoruba families and friends of the culture on Ngunnawal country.
            </p>
            <p className="mt-6 font-sans text-xs text-cream/45">
              Presented by {SITE.presenter}
            </p>
          </div>
          <div className="flex flex-col gap-6 sm:items-end">
            <nav aria-label="Footer navigation">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-cream/70 sm:justify-end">
                <li><Link href="#about" className="hover:text-gold-bright">About</Link></li>
                <li><Link href="#programme" className="hover:text-gold-bright">Programme</Link></li>
                <li><Link href="#rsvp" className="hover:text-gold-bright">RSVP</Link></li>
                <li><Link href="#contact" className="hover:text-gold-bright">Contact</Link></li>
              </ul>
            </nav>
            <ul className="flex flex-wrap gap-2 sm:justify-end" aria-label="Social media">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-gold/15 px-4 py-2 font-sans text-xs text-cream/70 transition-colors hover:border-gold-bright/40 hover:text-cream"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.07] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs text-cream/45">
            © {new Date().getFullYear()} {SITE.presenter}
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
