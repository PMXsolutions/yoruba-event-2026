"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";

const PHOTOS = [
  { src: "/gallery/01.jpg", alt: "Guests in traditional dress on stage at a previous Yoruba Day." },
  { src: "/gallery/02.jpg", alt: "Dancing in the hall at a previous Yoruba Day." },
  { src: "/gallery/03.jpg", alt: "Performers on stage at a previous Yoruba Day." },
  { src: "/gallery/04.jpg", alt: "A celebratory moment on the dance floor at a previous Yoruba Day." },
  { src: "/gallery/05.jpg", alt: "Dancers on stage at a previous Yoruba Day." },
  { src: "/gallery/06.jpg", alt: "Performers before the curtain at a previous Yoruba Day." },
  { src: "/gallery/07.jpg", alt: "Music and dance on stage at a previous Yoruba Day." },
  { src: "/gallery/08.jpg", alt: "Guests sharing a moment on stage at a previous Yoruba Day." },
  { src: "/gallery/09.jpg", alt: "Guests in gele and aso oke at a previous Yoruba Day." },
  { src: "/gallery/10.jpg", alt: "Guests in blue traditional dress at a previous Yoruba Day." },
  { src: "/gallery/11.jpg", alt: "Musicians at a previous Yoruba Day." },
  { src: "/gallery/12.jpg", alt: "A performer with the band at a previous Yoruba Day." },
  { src: "/gallery/13.jpg", alt: "Families gathered in the hall at a previous Yoruba Day." },
  { src: "/gallery/14.jpg", alt: "Guests in white and striped aso oke at a previous Yoruba Day." },
  { src: "/gallery/15.jpg", alt: "The community around a celebration cake at a previous Yoruba Day." },
  { src: "/gallery/16.jpg", alt: "Addressing guests in the hall at a previous Yoruba Day." },
  { src: "/gallery/17.jpg", alt: "A joyful moment at a previous Yoruba Day." },
] as const;

export function PreviousEdition() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const photo = PHOTOS[index];

  useEffect(() => {
    if (paused) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % PHOTOS.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused]);

  function show(next: number) {
    setIndex((next + PHOTOS.length) % PHOTOS.length);
  }

  return (
    <AnimatedSection
      id="gallery"
      className="relative scroll-mt-24 overflow-hidden bg-espresso py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(201,162,39,0.12),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Last edition"
          title="Moments from Yoruba Day"
          subtitle="Photographs from the previous celebration."
        />

        <div
          className="mx-auto max-w-4xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="relative overflow-hidden rounded-[1.75rem] border border-gold/20 bg-mahogany shadow-[var(--shadow-card-dark)]">
            <div className="relative aspect-[3/2]">
              <Image
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 896px) 896px, 100vw"
                className="object-cover"
                priority={index === 0}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-espresso/80 via-espresso/25 to-transparent p-4 sm:p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-cream/90">
                {index + 1} / {PHOTOS.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-gold/30 bg-espresso/70 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-gold-bright/50"
                  onClick={() => show(index - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="rounded-full border border-gold/30 bg-espresso/70 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-gold-bright/50"
                  onClick={() => show(index + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
