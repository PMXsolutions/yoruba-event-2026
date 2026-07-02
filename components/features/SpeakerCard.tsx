"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { EASE_LUX } from "@/lib/motion";

type Speaker = {
  id: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  photo_url?: string | null;
};

const PLACEHOLDER_PHOTOS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
];

export function SpeakerCard({ speaker, index }: { speaker: Speaker; index: number }) {
  const photo = speaker.photo_url ?? PLACEHOLDER_PHOTOS[index % PLACEHOLDER_PHOTOS.length];

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ delay: index * 0.08, duration: 0.7, ease: EASE_LUX }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-[1.35rem] border border-gold/15 bg-gradient-to-b from-mahogany/70 to-espresso/90 shadow-[var(--shadow-card-dark)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={photo}
          alt={speaker.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h3 className="font-display text-2xl font-semibold text-cream">{speaker.name}</h3>
          {speaker.title ? (
            <p className="mt-1 font-sans text-sm font-medium text-gold-bright">{speaker.title}</p>
          ) : null}
        </div>
      </div>
      {speaker.bio ? (
        <div className="p-6 pt-5">
          <p className="font-sans text-sm leading-relaxed text-cream/72">{speaker.bio}</p>
        </div>
      ) : null}
    </motion.article>
  );
}
