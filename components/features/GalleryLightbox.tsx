"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_LUX } from "@/lib/motion";

export type GalleryMediaItem = {
  id: string;
  title: string;
  mediaType: "image" | "video";
  url: string;
  thumbnailUrl?: string;
};

type GalleryLightboxProps = {
  items: GalleryMediaItem[];
};

export function GalleryLightbox({ items }: GalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(() => {
    setActiveIndex((i) => (i !== null ? (i - 1 + items.length) % items.length : null));
  }, [items.length]);
  const next = useCallback(() => {
    setActiveIndex((i) => (i !== null ? (i + 1) % items.length : null));
  }, [items.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [activeIndex, close, prev, next]);

  const active = activeIndex !== null ? items[activeIndex] : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ delay: index * 0.06, duration: 0.55, ease: EASE_LUX }}
            whileHover={{ y: -4 }}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-mahogany/10 bg-mahogany/5 shadow-[var(--shadow-card-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${item.title}`}
          >
            {item.mediaType === "image" ? (
              <Image
                src={item.url}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <>
                <Image
                  src={item.thumbnailUrl ?? item.url}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-espresso/30">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-cream/40 bg-espresso/60 text-cream">
                    ▶
                  </span>
                </span>
              </>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/80 to-transparent p-4">
              <p className="font-sans text-sm font-medium text-cream">{item.title}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-espresso/95 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            onClick={close}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 text-cream hover:bg-white/10"
              onClick={close}
              aria-label="Close gallery"
            >
              ✕
            </button>
            <button
              type="button"
              className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/30 text-cream hover:bg-white/10 sm:flex"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/30 text-cream hover:bg-white/10 sm:flex"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next"
            >
              ›
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_LUX }}
              className="relative max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {active.mediaType === "image" ? (
                <div className="relative aspect-video w-full">
                  <Image
                    src={active.url}
                    alt={active.title}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full bg-black">
                  <iframe
                    src={active.url}
                    title={active.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              <p className="bg-mahogany px-6 py-4 text-center font-sans text-sm text-cream">
                {active.title}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
