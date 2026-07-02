"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_ITEMS, SITE } from "@/lib/site";
import { EASE_LUX } from "@/lib/motion";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "border-b border-gold/12 bg-espresso/[0.88] py-3 shadow-[0_24px_64px_-28px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
          : "border-b border-white/[0.04] bg-gradient-to-b from-espresso/95 via-espresso/40 to-transparent py-4 backdrop-blur-md sm:py-5"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-bright/20 to-transparent opacity-80" />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          href="#home"
          className="group flex flex-col leading-tight"
          onClick={() => setOpen(false)}
        >
          <span className="font-display text-lg font-semibold tracking-tight text-cream transition-colors duration-300 group-hover:text-gold-bright sm:text-xl">
            Yoruba Day
          </span>
          <span className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-gold-muted transition-colors group-hover:text-gold-light">
            Canberra 2026
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group/nav relative rounded-full px-4 py-2.5 font-sans text-[0.8125rem] font-medium text-cream/75 transition-colors hover:text-cream"
            >
              <span className="relative z-10">{item.label}</span>
              <span className="absolute inset-x-3 bottom-1.5 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold-bright to-transparent transition-transform duration-500 group-hover/nav:scale-x-100" />
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="relative z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 bg-mahogany/60 text-cream shadow-inner backdrop-blur-sm transition-colors hover:border-gold-bright/40 hover:bg-mahogany/80 lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <motion.span
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-5 origin-center rounded-full bg-gold-light"
            />
            <motion.span
              animate={open ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
              className="block h-0.5 w-5 rounded-full bg-gold-light"
            />
            <motion.span
              animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-5 origin-center rounded-full bg-gold-light"
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.38, ease: EASE_LUX }}
            className="border-t border-gold/10 bg-espresso/[0.97] px-5 pb-10 pt-5 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-0.5">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, ease: EASE_LUX }}
                >
                  <Link
                    href={item.href}
                    className="block rounded-xl px-4 py-3.5 font-sans text-lg text-cream/92 transition-colors active:bg-white/5"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <p className="mt-6 border-t border-white/5 px-4 pt-6 font-sans text-sm text-cream/50">
                {SITE.location}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
