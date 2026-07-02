"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SITE } from "@/lib/site";
import { EASE_LUX } from "@/lib/motion";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(target: Date): TimeLeft {
  const total = Math.max(0, target.getTime() - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds };
}

const pad2 = (n: number) => n.toString().padStart(2, "0");
const formatDays = (d: number) => (d < 100 ? pad2(d) : String(d));

/** Stable SSR/hydration initial — never use Date.now() until after mount. */
const PLACEHOLDER_LEFT: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function CountdownTimer() {
  const target = useMemo(() => new Date(SITE.eventIso), []);
  const [left, setLeft] = useState<TimeLeft>(PLACEHOLDER_LEFT);

  useEffect(() => {
    const tick = () => setLeft(getTimeLeft(target));
    const rafId = window.requestAnimationFrame(tick);
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearInterval(intervalId);
    };
  }, [target]);

  const units = [
    { label: "Days", value: formatDays(left.days), key: "d" },
    { label: "Hours", value: pad2(left.hours), key: "h" },
    { label: "Minutes", value: pad2(left.minutes), key: "m" },
    { label: "Seconds", value: pad2(left.seconds), key: "s" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-start sm:gap-3 md:gap-4">
      {units.map((u, index) => (
        <motion.div
          key={u.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * index, duration: 0.55, ease: EASE_LUX }}
        >
          <div
            className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-b from-mahogany/90 to-espresso/95 px-4 py-5 text-center shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(201,162,39,0.06)] backdrop-blur-md transition-[border-color,box-shadow] duration-500 hover:border-gold-bright/35 hover:shadow-[0_24px_56px_-24px_rgba(201,162,39,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] sm:min-w-[5.75rem] sm:px-5 sm:py-6"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12] bg-motif-geo transition-opacity duration-500 group-hover:opacity-[0.18]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold-bright/15 blur-2xl transition-all duration-700 group-hover:bg-gold-bright/25"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/50 to-transparent opacity-60" />
            <p className="relative font-display text-[clamp(1.75rem,5vw,2.35rem)] font-semibold tabular-nums leading-none tracking-tight text-cream sm:text-4xl">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={u.value + u.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: EASE_LUX }}
                  className="inline-block"
                >
                  {u.value}
                </motion.span>
              </AnimatePresence>
            </p>
            <p className="relative mt-3 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-gold-muted group-hover:text-gold-light sm:text-[0.65rem]">
              {u.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
