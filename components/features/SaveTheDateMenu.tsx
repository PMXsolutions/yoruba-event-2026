"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  buildCalendarDetails,
  downloadIcsFile,
  googleCalendarUrl,
  outlookCalendarUrl,
} from "@/lib/calendar/event-calendar";
import { Button } from "@/components/ui/Button";
import { EASE_LUX } from "@/lib/motion";
import { yorubaDayCanberra2026 } from "@/config/events/yoruba-day-canberra-2026";
import { LAUNCH_COPY } from "@/lib/site";

type SaveTheDateMenuProps = {
  label?: string;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
};

export function SaveTheDateMenu({
  label = LAUNCH_COPY.saveTheDate,
  variant = "outline",
  className,
}: SaveTheDateMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const event = yorubaDayCanberra2026;
  const details = buildCalendarDetails(event);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const options = [
    {
      label: "Download .ics",
      action: () => {
        downloadIcsFile(details, `${event.slug}.ics`, event.organisation);
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
      label: "Outlook Calendar",
      action: () => {
        window.open(outlookCalendarUrl(details), "_blank", "noopener,noreferrer");
        setOpen(false);
      },
    },
  ];

  return (
    <div ref={ref} className={`relative inline-flex ${className ?? ""}`}>
      <Button
        type="button"
        variant={variant}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
      </Button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: EASE_LUX }}
            className="absolute left-0 top-full z-50 mt-2 min-w-[14rem] overflow-hidden rounded-2xl border border-gold/20 bg-mahogany/95 p-1.5 shadow-[0_24px_64px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            role="menu"
          >
            {options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="menuitem"
                className="block w-full rounded-xl px-4 py-3 text-left font-sans text-sm text-cream/90 transition-colors hover:bg-white/5 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
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
