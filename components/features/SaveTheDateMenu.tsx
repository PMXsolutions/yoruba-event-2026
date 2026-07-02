"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EventConfig } from "@/platform/core/types/event";
import {
  appleCalendarAction,
  buildCalendarDetails,
  downloadIcsFile,
  googleCalendarUrl,
  outlookCalendarUrl,
} from "@/lib/calendar/event-calendar";
import { Button } from "@/components/ui/Button";
import { EASE_LUX } from "@/lib/motion";

type SaveTheDateMenuProps = {
  event: Pick<EventConfig, "name" | "tagline" | "eventIso" | "location" | "venue" | "canonicalUrl" | "organisation">;
  label?: string;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
};

export function SaveTheDateMenu({
  event,
  label = "Save the Date",
  variant = "outline",
  className,
}: SaveTheDateMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const details = buildCalendarDetails(event as EventConfig);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options = [
    {
      label: "Download .ics file",
      action: () => {
        downloadIcsFile(details);
        setOpen(false);
      },
    },
    {
      label: "Google Calendar",
      action: () => {
        window.open(googleCalendarUrl(details), "_blank", "noopener,noreferrer");
        setOpen(false);
      },
    },
    {
      label: "Outlook",
      action: () => {
        window.open(outlookCalendarUrl(details), "_blank", "noopener,noreferrer");
        setOpen(false);
      },
    },
    {
      label: "Apple Calendar",
      action: () => {
        appleCalendarAction(details);
        setOpen(false);
      },
    },
  ];

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <Button type="button" variant={variant} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {label}
      </Button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: EASE_LUX }}
            className="absolute left-0 top-full z-50 mt-2 min-w-[14rem] overflow-hidden rounded-2xl border border-gold/20 bg-mahogany/95 p-1.5 shadow-[var(--shadow-elevated)] backdrop-blur-xl"
            role="menu"
          >
            {options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="menuitem"
                className="block w-full rounded-xl px-4 py-3 text-left font-sans text-sm text-cream/90 transition-colors hover:bg-white/5 hover:text-cream"
                onClick={opt.action}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
