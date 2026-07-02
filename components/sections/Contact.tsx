import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SITE, SOCIAL_LINKS, ACTIVE_EVENT } from "@/lib/site";

export function Contact() {
  return (
    <AnimatedSection
      id="contact"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-mahogany via-espresso to-[#0a0504] py-20 sm:py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-motif-geo opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Get in touch"
          title="We would love to hear from you"
          subtitle="For partnerships, press enquiries, volunteering, or general questions about Yoruba Day Canberra 2026."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <div className="rounded-2xl border border-gold/15 bg-mahogany/40 p-6 backdrop-blur-sm">
              <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-gold-muted">Email</p>
              <a
                href={`mailto:${ACTIVE_EVENT.contact.email}`}
                className="mt-2 block font-sans text-lg text-gold-light transition-colors hover:text-gold-bright"
              >
                {ACTIVE_EVENT.contact.email}
              </a>
            </div>
            <div className="rounded-2xl border border-gold/15 bg-mahogany/40 p-6 backdrop-blur-sm">
              <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-gold-muted">Phone</p>
              <a
                href={`tel:${ACTIVE_EVENT.contact.phone?.replace(/\s/g, "")}`}
                className="mt-2 block font-sans text-lg text-cream/90 transition-colors hover:text-cream"
              >
                {ACTIVE_EVENT.contact.phone}
              </a>
            </div>
            <div className="rounded-2xl border border-gold/15 bg-mahogany/40 p-6 backdrop-blur-sm">
              <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-gold-muted">Venue</p>
              <p className="mt-2 font-sans text-sm leading-relaxed text-cream/80">{SITE.venue.name}</p>
              <p className="mt-1 font-sans text-sm text-cream/60">{SITE.venue.fullAddress}</p>
              <a
                href={SITE.venue.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex font-sans text-sm font-semibold text-gold-bright hover:text-gold-light"
              >
                Open in Google Maps →
              </a>
            </div>
            <div>
              <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-gold-muted">Follow us</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.platform}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-gold/20 bg-white/[0.03] px-5 py-2.5 font-sans text-sm text-cream/80 transition-colors hover:border-gold-bright/40 hover:text-cream"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gold/15 shadow-[var(--shadow-card-dark)]">
            <iframe
              title="Event venue location"
              src={SITE.venue.mapsEmbedUrl}
              className="h-[min(24rem,60vh)] w-full border-0 grayscale-[30%] contrast-[1.05] sm:h-[28rem]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
