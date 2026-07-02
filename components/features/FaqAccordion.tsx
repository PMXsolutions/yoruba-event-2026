"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_LUX } from "@/lib/motion";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
  /** Reserved for future AI-assisted FAQ search */
  aiReady?: boolean;
};

export function FaqAccordion({ items, aiReady = true }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-3" data-ai-ready={aiReady ? "true" : undefined}>
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ delay: index * 0.05, duration: 0.5, ease: EASE_LUX }}
            className="overflow-hidden rounded-2xl border border-mahogany/10 bg-cream/90 shadow-[var(--shadow-card-light)]"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-cream-warm/50"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <span className="font-display text-lg font-semibold text-mahogany sm:text-xl">
                {item.question}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 text-gold-deep transition-transform duration-300 ${isOpen ? "rotate-45 bg-gold/10" : ""}`}
                aria-hidden
              >
                +
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE_LUX }}
                >
                  <div className="border-t border-mahogany/8 px-6 pb-6 pt-4">
                    <p className="font-sans text-sm leading-relaxed text-mahogany/75 sm:text-[0.95rem]">
                      {item.answer}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
