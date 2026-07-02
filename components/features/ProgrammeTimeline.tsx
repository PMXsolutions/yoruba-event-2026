"use client";

import { motion } from "framer-motion";
import { EASE_LUX } from "@/lib/motion";

type ProgrammeItem = {
  id: string;
  time_label: string;
  title: string;
  description?: string | null;
  location?: string | null;
};

export function ProgrammeTimeline({ items }: { items: ProgrammeItem[] }) {
  return (
    <div className="relative mt-14 sm:mt-16">
      <div
        className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-gradient-to-b from-gold-bright/60 via-gold/30 to-transparent sm:left-1/2 sm:-translate-x-px"
        aria-hidden
      />
      <ol className="space-y-8 sm:space-y-10">
        {items.map((item, index) => {
          const isEven = index % 2 === 0;
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ delay: index * 0.06, duration: 0.65, ease: EASE_LUX }}
              className={`relative grid gap-6 sm:grid-cols-2 sm:gap-12 ${isEven ? "" : "sm:[&>article]:col-start-2"}`}
            >
              <div
                className={`hidden sm:block ${isEven ? "col-start-2" : "col-start-1 row-start-1 text-right"}`}
                aria-hidden
              >
                <span className="font-display text-2xl font-semibold text-gold-deep/40">
                  {item.time_label}
                </span>
              </div>

              <span
                className="absolute left-[1.15rem] top-6 z-10 flex h-[0.65rem] w-[0.65rem] -translate-x-1/2 items-center justify-center rounded-full border-2 border-gold bg-cream shadow-[0_0_12px_rgba(201,162,39,0.4)] sm:left-1/2"
                aria-hidden
              />

              <article className="ml-10 rounded-2xl border border-mahogany/10 bg-cream/95 p-6 shadow-[var(--shadow-card-light)] sm:ml-0 sm:p-7">
                <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.24em] text-gold-deep sm:hidden">
                  {item.time_label}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-mahogany sm:mt-0 sm:text-2xl">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mt-3 font-sans text-sm leading-relaxed text-mahogany/70">
                    {item.description}
                  </p>
                ) : null}
                {item.location ? (
                  <p className="mt-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-muted">
                    {item.location}
                  </p>
                ) : null}
              </article>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
