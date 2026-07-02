"use client";

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { submitVolunteer } from "@/app/actions/volunteer";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { EASE_LUX } from "@/lib/motion";
import { volunteerFormSchema, type VolunteerFormValues } from "@/lib/validation/volunteer";

const labelClass =
  "mb-2 block font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-mahogany/55";
const inputClass =
  "w-full rounded-xl border border-mahogany/12 bg-white px-4 py-3 font-sans text-sm text-mahogany outline-none transition-colors focus:border-gold/50 focus:ring-2 focus:ring-gold/15";

export function VolunteerSection() {
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof VolunteerFormValues, string>>>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      skills: String(form.get("skills") ?? ""),
      availability: String(form.get("availability") ?? ""),
    };

    const parsed = volunteerFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Partial<Record<keyof VolunteerFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") errs[key as keyof VolunteerFormValues] = issue.message;
      }
      setFieldErrors(errs);
      setError("Please correct the highlighted fields.");
      return;
    }

    setIsPending(true);
    try {
      const result = await submitVolunteer(parsed.data);
      if (result.ok) {
        setSubmitted(true);
        e.currentTarget.reset();
        return;
      }
      setError(result.error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AnimatedSection
      id="volunteer"
      className="relative scroll-mt-24 bg-gradient-to-b from-cream-warm via-cream to-cream-deep py-20 sm:py-28"
    >
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <SectionHeading
            surface="onLight"
            align="left"
            eyebrow="Give your time"
            title="Volunteer with us"
            subtitle="Help create an unforgettable evening — from hospitality and stage support to community engagement."
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_LUX }}
            className="rounded-2xl border border-mahogany/10 bg-cream/95 p-6 shadow-[var(--shadow-card-light)] sm:p-8"
          >
            {submitted ? (
              <div className="py-8 text-center">
                <p className="font-display text-2xl font-semibold text-mahogany">Thank you for volunteering</p>
                <p className="mt-3 font-sans text-sm text-mahogany/70">
                  We have received your details and will be in touch with role assignments closer to the event.
                </p>
                <Button type="button" variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
                  Register another volunteer
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error ? (
                  <div role="alert" className="rounded-xl border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-900">
                    {error}
                  </div>
                ) : null}
                <div>
                  <label htmlFor="vol-fullName" className={labelClass}>Full name</label>
                  <input id="vol-fullName" name="fullName" required className={inputClass} />
                  {fieldErrors.fullName ? <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p> : null}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="vol-email" className={labelClass}>Email</label>
                    <input id="vol-email" name="email" type="email" required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="vol-phone" className={labelClass}>Phone</label>
                    <input id="vol-phone" name="phone" type="tel" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="vol-skills" className={labelClass}>Skills</label>
                  <input id="vol-skills" name="skills" placeholder="e.g. Hospitality, AV, Photography" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="vol-availability" className={labelClass}>Availability</label>
                  <textarea id="vol-availability" name="availability" rows={3} placeholder="Which hours or areas can you help?" className={inputClass} />
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Submitting…" : "Register as volunteer"}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
