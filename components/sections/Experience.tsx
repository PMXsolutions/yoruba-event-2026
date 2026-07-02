"use client";

import { motion } from "framer-motion";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EXPERIENCE_ITEMS } from "@/lib/site";
import { EASE_LUX } from "@/lib/motion";

const list = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

const card = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_LUX },
  },
};

export function Experience() {
  return (
    <AnimatedSection
      id="experience"
      className="relative scroll-mt-24 overflow-hidden bg-espresso py-20 sm:py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(201,162,39,0.16),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-motif-textile opacity-40 mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="The experience"
          title="A tapestry of sound, taste, and ceremony"
          subtitle="Each moment is composed like a movement in music—from talking drum and Eyo procession to Aso Oke, Yoruba plates, and voices of every generation."
        />
        <motion.ul
          variants={list}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
        >
          {EXPERIENCE_ITEMS.map((exp) => (
            <motion.li
              key={exp.title}
              variants={card}
              whileHover={{ y: -6, transition: { duration: 0.35, ease: EASE_LUX } }}
              className="group relative flex min-h-[15.5rem] flex-col overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-br from-mahogany/95 via-mahogany/70 to-espresso/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_50px_-34px_rgba(0,0,0,0.75)] transition-[border-color,box-shadow] duration-500 hover:border-gold-bright/30 hover:shadow-[0_28px_60px_-28px_rgba(201,162,39,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] sm:min-h-[16.5rem] sm:rounded-[1.35rem] sm:p-8"
            >
              <div className="pointer-events-none absolute inset-0 bg-motif-geo opacity-[0.08] transition-opacity duration-500 group-hover:opacity-[0.14]" />
              <div className="relative mb-4 flex items-start justify-between gap-3">
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/[0.07] font-display text-base text-gold-bright shadow-inner transition-all duration-500 group-hover:border-gold-bright/50 group-hover:bg-gold/[0.12] group-hover:shadow-[0_0_24px_-4px_rgba(201,162,39,0.35)] sm:h-12 sm:w-12 sm:text-lg"
                  aria-hidden
                >
                  {exp.accent}
                </span>
                <span className="rounded-full border border-gold/20 bg-espresso/40 px-3 py-1 font-sans text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-gold-muted">
                  {exp.accentLabel}
                </span>
              </div>
              <h3 className="relative font-display text-xl font-semibold leading-snug text-cream sm:text-2xl">
                {exp.title}
              </h3>
              <p className="relative mt-3 flex-1 font-sans text-sm leading-relaxed text-cream/72 sm:text-[0.95rem] sm:leading-[1.65]">
                {exp.description}
              </p>
              <div className="pointer-events-none absolute -right-8 bottom-0 h-28 w-28 rounded-full bg-gold-bright/10 blur-2xl transition-all duration-500 group-hover:scale-110 group-hover:opacity-100" />
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </AnimatedSection>
  );
}
