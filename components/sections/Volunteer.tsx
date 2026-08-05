"use client";

import { type FormEvent, useState } from "react";
import { submitVolunteerAction } from "@/app/actions/dashboard";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

const field =
  "w-full rounded-2xl border border-white/[0.08] bg-mahogany/50 px-5 py-4 font-sans text-[0.95rem] text-cream outline-none placeholder:text-cream/30 focus:border-gold-bright/55 focus:ring-2 focus:ring-gold/15";
const label =
  "mb-2.5 block font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-gold-muted";

export function Volunteer() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    skills: "",
    availability: "",
    areaOfInterest: "",
    notes: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await submitVolunteerAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      setForm({
        fullName: "",
        email: "",
        phone: "",
        skills: "",
        availability: "",
        areaOfInterest: "",
        notes: "",
      });
    } catch {
      setError("Something went wrong while submitting. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AnimatedSection
      id="volunteer"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-espresso via-mahogany to-espresso py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-motif-geo opacity-20" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Serve with us"
          title="Volunteer at Yoruba Day"
          subtitle="Help welcome guests, support the programme, and bring the celebration to life. Share your skills and availability and our committee will be in touch."
        />

        <div className="mx-auto mt-12 max-w-3xl rounded-[1.75rem] border border-gold/20 bg-mahogany/50 p-6 backdrop-blur-sm sm:p-8">
          {done ? (
            <p
              role="status"
              className="mb-6 rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-sm text-cream/90"
            >
              Thank you — your volunteer registration has been received.
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="mb-6 rounded-xl border border-red-400/35 bg-red-950/35 px-4 py-3 text-sm text-red-100"
            >
              {error}
            </p>
          ) : null}

          <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="vol-name" className={label}>
                Full name
              </label>
              <input
                id="vol-name"
                required
                className={field}
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="vol-email" className={label}>
                Email
              </label>
              <input
                id="vol-email"
                type="email"
                required
                className={field}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="vol-phone" className={label}>
                Phone
              </label>
              <input
                id="vol-phone"
                className={field}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="vol-skills" className={label}>
                Skills
              </label>
              <input
                id="vol-skills"
                className={field}
                placeholder="Hospitality, stage, photography…"
                value={form.skills}
                onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="vol-availability" className={label}>
                Availability
              </label>
              <input
                id="vol-availability"
                className={field}
                placeholder="Full day / afternoon / evening"
                value={form.availability}
                onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="vol-interest" className={label}>
                Area of interest
              </label>
              <input
                id="vol-interest"
                className={field}
                placeholder="Registration, ushering, catering…"
                value={form.areaOfInterest}
                onChange={(e) => setForm((f) => ({ ...f, areaOfInterest: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="vol-notes" className={label}>
                Notes
              </label>
              <textarea
                id="vol-notes"
                rows={3}
                className={field}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Submitting…" : "Register as volunteer"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedSection>
  );
}
