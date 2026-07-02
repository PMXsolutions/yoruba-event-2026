"use client";

import { motion } from "framer-motion";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SPONSOR_TIERS, LAUNCH_COPY } from "@/lib/site";
import { EASE_LUX } from "@/lib/motion";

const tierAccent = {
  platinum: "from-white/90 via-cream/40 to-transparent",
  gold: "from-gold-bright via-gold to-gold-deep",
  heritage: "from-gold-muted via-gold/70 to-gold-deep",
  community: "from-cream via-gold-light/35 to-cream-deep/80",
} as const;

const tierBadge = {
  platinum: "Platinum",
  gold: "Gold",
  heritage: "Heritage",
  community: "Community",
} as const;

export function Sponsors() {
  return (
    <AnimatedSection
      id="sponsors"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-cream-deep via-cream to-cream-warm py-20 sm:py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-motif-textile-light opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-deep/35 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-[min(90vw,40rem)] -translate-x-1/2 rounded-full bg-gold/10 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          surface="onLight"
          eyebrow="Partners in excellence"
          title="Sponsor the most anticipated cultural evening of the year"
          subtitle="Stand alongside a community-led celebration of Yoruba excellence in Canberra—visible, meaningful, and crafted with warmth for guests and partners alike."
        />
        <p className="mx-auto mb-10 max-w-2xl rounded-2xl border border-gold/25 bg-cream/80 px-6 py-4 text-center font-sans text-sm leading-relaxed text-mahogany/75 shadow-[var(--shadow-card-light)] sm:mb-12 sm:text-[0.95rem]">
          {LAUNCH_COPY.sponsorshipAnnouncedSoon} Enquire below to express early interest—our team
          will share the sponsorship deck when packages are finalised.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {SPONSOR_TIERS.map((s, index) => (
            <motion.article
              key={s.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ delay: index * 0.08, duration: 0.7, ease: EASE_LUX }}
              whileHover={{ y: -8, transition: { duration: 0.4, ease: EASE_LUX } }}
              className="group relative flex flex-col overflow-hidden rounded-[1.35rem] border border-mahogany/10 bg-cream/90 shadow-[var(--shadow-card-light)] transition-shadow duration-500 hover:shadow-[0_40px_80px_-44px_rgba(58,36,25,0.38),0_0_0_1px_rgba(201,162,39,0.12)]"
            >
              <div
                className={`relative flex h-40 flex-col items-center justify-center overflow-hidden border-b border-mahogany/10 bg-gradient-to-br ${tierAccent[s.tier]} px-6 ring-1 ring-inset ring-white/10`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(125deg,transparent_35%,rgba(255,255,255,0.5)_50%,transparent_65%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                <p className="relative z-10 mb-4 font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-mahogany/55">
                  {tierBadge[s.tier]}
                </p>
                <motion.div
                  className="relative z-10 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-mahogany/12 bg-gradient-to-b from-cream to-cream-deep shadow-[0_12px_32px_-16px_rgba(36,21,15,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]"
                  whileHover={{ scale: 1.06, rotate: -1.5 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  <motion.span
                    className="font-display text-[0.65rem] font-bold uppercase tracking-[0.22em] text-mahogany/35"
                    whileHover={{ scale: 1.05 }}
                  >
                    Logo
                  </motion.span>
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-gold/0 transition-all duration-500 group-hover:ring-gold/35"
                  />
                </motion.div>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="font-display text-lg font-semibold leading-snug text-mahogany sm:text-xl">
                  {s.name}
                </h3>
                <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-mahogany/68 sm:text-[0.95rem]">
                  Join us in elevating Yoruba Day with dignified visibility across print, digital,
                  and on-site moments that guests and families will remember.
                </p>
                <p className="mt-5 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                  Packages announced soon
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
