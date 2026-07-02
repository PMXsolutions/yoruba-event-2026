"use client";

import { motion } from "framer-motion";
import { CountdownTimer } from "@/components/features/CountdownTimer";
import { SaveTheDateMenu } from "@/components/features/SaveTheDateMenu";
import { ButtonLink } from "@/components/ui/Button";
import { SITE, LAUNCH_COPY, ACTIVE_EVENT } from "@/lib/site";
import { EASE_LUX } from "@/lib/motion";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: EASE_LUX },
  },
};

function splitTitle(name: string) {
  const m = /^(.+)\s(\d{4})$/.exec(name.trim());
  if (!m) return { main: name, year: "" };
  return { main: m[1], year: m[2] };
}

export function Hero() {
  const { main, year } = splitTitle(SITE.name);

  return (
    <section
      id="home"
      className="relative min-h-[100dvh] overflow-hidden bg-espresso pb-28 pt-28 sm:pb-36 sm:pt-36 md:pt-40"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-mahogany/40 via-espresso to-espresso" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(201,162,39,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_50%,rgba(228,199,106,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-motif-geo opacity-[0.35]" />
        <div className="absolute inset-0 bg-motif-textile opacity-50 mix-blend-soft-light" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-transparent to-espresso/80" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/35 to-transparent" />
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-1/4 h-[min(90vw,32rem)] w-[min(90vw,32rem)] rounded-full bg-gradient-to-br from-gold-bright/25 via-gold/10 to-transparent blur-[100px]"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-1/3 bottom-0 h-[min(100vw,36rem)] w-[min(100vw,36rem)] rounded-full bg-gradient-to-tl from-gold-muted/30 via-gold/8 to-transparent blur-[120px] animate-ambient-glow"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,8,6,0.55)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-5 rounded-[2rem] border border-gold/10 sm:inset-8 sm:rounded-[2.5rem]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-5 sm:px-8 lg:px-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          <motion.p
            variants={item}
            className="mb-4 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.38em] text-gold-bright sm:text-xs sm:tracking-[0.42em]"
          >
            Presented by {SITE.presenter}
          </motion.p>
          <motion.div variants={item} className="relative">
            <h1 className="font-display text-[clamp(2.35rem,6.5vw,5rem)] font-semibold leading-[1.02] tracking-tight text-cream">
              <span className="block">{main}</span>
              {year ? (
                <span className="mt-1 block bg-gradient-to-r from-gold-light via-gold-bright to-gold bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(201,162,39,0.25)]">
                  {year}
                </span>
              ) : null}
            </h1>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 bg-mahogany/40 text-gold-bright" aria-hidden>
                ◷
              </span>
              <div>
                <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.22em] text-gold-muted">Date</p>
                <p className="font-display text-xl font-semibold text-cream sm:text-2xl">{SITE.heroDateLine}</p>
              </div>
            </div>
            <div className="hidden h-8 w-px bg-gold/20 sm:block" aria-hidden />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 bg-mahogany/40 text-gold-bright" aria-hidden>
                ◎
              </span>
              <div>
                <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.22em] text-gold-muted">Location</p>
                <p className="font-sans text-base font-medium text-cream/90 sm:text-lg">{SITE.venue.name}</p>
                <p className="font-sans text-sm text-cream/60">{SITE.heroPlaceLine}</p>
              </div>
            </div>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-9 max-w-2xl font-sans text-[1.05rem] leading-[1.75] text-cream/80 sm:mt-10 sm:text-xl sm:leading-[1.7]"
          >
            {SITE.tagline}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.85, ease: EASE_LUX }}
          className="mt-14 max-w-2xl sm:mt-16"
        >
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="h-px flex-1 max-w-[3rem] bg-gradient-to-r from-gold-bright/60 to-transparent sm:max-w-[4rem]" />
            <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.38em] text-gold-muted sm:text-xs">
              Countdown to celebration
            </p>
          </div>
          <CountdownTimer />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.85, ease: EASE_LUX }}
          className="mt-12 flex flex-col gap-5 sm:mt-14"
        >
          <div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center">
            <ButtonLink href="#rsvp">{LAUNCH_COPY.registerInterest}</ButtonLink>
            <ButtonLink href="#sponsor-form" variant="outline">
              {LAUNCH_COPY.becomeSponsor}
            </ButtonLink>
            <SaveTheDateMenu event={ACTIVE_EVENT} label={LAUNCH_COPY.saveTheDate} variant="ghost" />
          </div>
        </motion.div>
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-gold-muted">Scroll</span>
        <div className="h-16 w-px bg-gradient-to-b from-gold-bright/50 via-gold/30 to-transparent" />
      </motion.div>
    </section>
  );
}
