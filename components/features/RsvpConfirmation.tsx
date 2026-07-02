"use client";

import { motion } from "framer-motion";
import type { RsvpConfirmationData } from "@/app/actions/rsvp";
import { ACTIVE_EVENT } from "@/lib/site";
import { CalendarLinks } from "@/components/features/CalendarLinks";
import { Button } from "@/components/ui/Button";
import { EASE_LUX } from "@/lib/motion";

type RsvpConfirmationProps = {
  data: RsvpConfirmationData;
  emailSent: boolean;
  onRegisterAnother: () => void;
};

function QrPlaceholder({ reference }: { reference: string }) {
  const cells = Array.from({ length: 64 }, (_, i) => {
    const hash = reference.charCodeAt(i % reference.length) + i;
    return hash % 3 !== 0;
  });

  return (
    <div className="mx-auto flex flex-col items-center gap-3">
      <div
        className="grid grid-cols-8 gap-0.5 rounded-xl border border-gold/20 bg-cream p-3 shadow-inner"
        aria-hidden
      >
        {cells.map((filled, i) => (
          <div
            key={i}
            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${filled ? "bg-espresso" : "bg-cream"}`}
          />
        ))}
      </div>
      <p className="font-mono text-[0.65rem] tracking-wider text-gold-muted">{reference}</p>
    </div>
  );
}

export function RsvpConfirmation({ data, emailSent, onRegisterAnother }: RsvpConfirmationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE_LUX }}
      className="relative py-6 text-center sm:py-10"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.15),transparent_70%)]" />

      <div className="relative mx-auto max-w-lg rounded-[1.5rem] border border-gold/25 bg-gradient-to-b from-mahogany/60 to-espresso/90 p-8 shadow-[var(--shadow-card-dark)] sm:p-10">
        <div className="mb-2 font-sans text-[0.65rem] font-bold uppercase tracking-[0.32em] text-gold-bright">
          Registration confirmed
        </div>
        <h3 className="font-display text-2xl font-semibold text-cream sm:text-3xl">
          Thank you, {data.fullName}
        </h3>
        <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-cream/75">
          Your interest has been registered. Present your reference at check-in when ticketing opens.
        </p>

        <div className="mt-8 rounded-2xl border border-gold/15 bg-espresso/50 p-5">
          <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-gold-muted">
            Registration reference
          </p>
          <p className="mt-2 font-mono text-lg font-semibold tracking-wide text-gold-bright sm:text-xl">
            {data.registrationReference}
          </p>
        </div>

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-white/8 bg-mahogany/30 px-4 py-3">
            <p className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-gold-muted">Event</p>
            <p className="mt-1 font-sans text-sm text-cream">{ACTIVE_EVENT.name}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-mahogany/30 px-4 py-3">
            <p className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-gold-muted">Date</p>
            <p className="mt-1 font-sans text-sm text-cream">{ACTIVE_EVENT.heroDateDisplay}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-mahogany/30 px-4 py-3">
            <p className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-gold-muted">Guests</p>
            <p className="mt-1 font-sans text-sm text-cream">{data.attendees}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-mahogany/30 px-4 py-3">
            <p className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-gold-muted">Ticket type</p>
            <p className="mt-1 font-sans text-sm text-cream">{data.ticketType}</p>
          </div>
        </div>

        <div className="mt-8">
          <QrPlaceholder reference={data.registrationReference} />
        </div>

        <div className="mt-8">
          <p className="mb-3 font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-gold-muted">
            Add to calendar
          </p>
          <CalendarLinks event={ACTIVE_EVENT} />
        </div>

        {emailSent ? (
          <p className="mt-6 font-sans text-xs text-cream/55">
            A confirmation email has been sent to {data.email}.
          </p>
        ) : (
          <p className="mt-6 font-sans text-xs text-cream/45">
            Save your reference above — email confirmation may arrive shortly.
          </p>
        )}
      </div>

      <Button type="button" variant="outline" className="mt-8" onClick={onRegisterAnother}>
        Register another guest
      </Button>
    </motion.div>
  );
}
