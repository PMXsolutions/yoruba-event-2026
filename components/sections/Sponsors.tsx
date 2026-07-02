"use client";

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { submitSponsor } from "@/app/actions/sponsor";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SPONSOR_TIERS, LAUNCH_COPY } from "@/lib/site";
import { EASE_LUX } from "@/lib/motion";
import { sponsorFormSchema, type SponsorFormValues } from "@/lib/validation/sponsor";

const tierAccent = {
  platinum: "from-white/90 via-cream/40 to-transparent",
  gold: "from-gold-bright via-gold to-gold-deep",
  heritage: "from-gold-muted via-gold/70 to-gold-deep",
  community: "from-cream via-gold-light/35 to-cream-deep/80",
} as const;

const tierBadge = {
  platinum: "Platinum",
  gold: "Gold",
  heritage: "Heritage",
  community: "Community",
} as const;

const labelClass =
  "mb-2 block font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-mahogany/55";
const inputClass =
  "w-full rounded-xl border border-mahogany/12 bg-cream px-4 py-3 font-sans text-sm text-mahogany outline-none transition-colors focus:border-gold/50 focus:ring-2 focus:ring-gold/15";

export function Sponsors() {
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SponsorFormValues, string>>>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = new FormData(e.currentTarget);
    const payload = {
      company: String(form.get("company") ?? ""),
      contactPerson: String(form.get("contactPerson") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      website: String(form.get("website") ?? ""),
      package: String(form.get("package") ?? ""),
      message: String(form.get("message") ?? ""),
      logoDataUrl: String(form.get("logoDataUrl") ?? ""),
    };

    const parsed = sponsorFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Partial<Record<keyof SponsorFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !errs[key as keyof SponsorFormValues]) {
          errs[key as keyof SponsorFormValues] = issue.message;
        }
      }
      setFieldErrors(errs);
      setError("Please correct the highlighted fields.");
      return;
    }

    setIsPending(true);
    try {
      const result = await submitSponsor(parsed.data);
      if (result.ok) {
        setSubmitted(true);
        e.currentTarget.reset();
        return;
      }
      setError(result.error);
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    } finally {
      setIsPending(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const hidden = document.getElementById("logoDataUrl") as HTMLInputElement | null;
      if (hidden && typeof reader.result === "string") {
        hidden.value = reader.result;
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <AnimatedSection
      id="sponsors"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-cream-deep via-cream to-cream-warm py-20 sm:py-28 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-motif-textile-light opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-deep/35 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          surface="onLight"
          eyebrow="Partners in excellence"
          title="Sponsor the most anticipated cultural evening of the year"
          subtitle="Stand alongside a community-led celebration of Yoruba excellence in Canberra—visible, meaningful, and crafted with warmth."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {SPONSOR_TIERS.map((s, index) => (
            <motion.article
              key={s.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ delay: index * 0.08, duration: 0.7, ease: EASE_LUX }}
              whileHover={{ y: -8 }}
              className="group relative flex flex-col overflow-hidden rounded-[1.35rem] border border-mahogany/10 bg-cream/90 shadow-[var(--shadow-card-light)]"
            >
              <div
                className={`relative flex h-28 flex-col items-center justify-center overflow-hidden border-b border-mahogany/10 bg-gradient-to-br ${tierAccent[s.tier]} px-6`}
              >
                <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-mahogany/55">
                  {tierBadge[s.tier]}
                </p>
                <p className="mt-2 font-display text-lg font-semibold text-mahogany">{s.pricePlaceholder}</p>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-lg font-semibold text-mahogany">{s.name}</h3>
                <ul className="mt-4 flex-1 space-y-2">
                  {s.benefits.map((b) => (
                    <li key={b} className="flex gap-2 font-sans text-sm text-mahogany/68">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
                <ButtonLink href="#sponsor-form" variant="outline" className="mt-6 w-full justify-center text-xs">
                  Enquire now
                </ButtonLink>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          id="sponsor-form"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.75, ease: EASE_LUX }}
          className="relative mt-20 scroll-mt-28 rounded-[1.75rem] border border-mahogany/10 bg-cream/95 p-6 shadow-[var(--shadow-card-light)] sm:p-10"
        >
          <h3 className="font-display text-2xl font-semibold text-mahogany sm:text-3xl">
            Sponsorship registration
          </h3>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-mahogany/70">
            {LAUNCH_COPY.sponsorshipAnnouncedSoon} Complete the form below and our partnerships team will be in touch.
          </p>

          {submitted ? (
            <div className="mt-8 rounded-2xl border border-gold/25 bg-gold/5 p-8 text-center">
              <p className="font-display text-2xl font-semibold text-mahogany">Thank you for your enquiry</p>
              <p className="mx-auto mt-3 max-w-md font-sans text-sm text-mahogany/70">
                Your sponsorship application has been received. A confirmation email is on its way, and our team will respond within 3–5 business days.
              </p>
              <Button type="button" variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
                Submit another enquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {error ? (
                <div role="alert" className="rounded-xl border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {error}
                </div>
              ) : null}
              <input type="hidden" id="logoDataUrl" name="logoDataUrl" defaultValue="" />
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className={labelClass}>Company</label>
                  <input id="company" name="company" required className={inputClass} />
                  {fieldErrors.company ? <p className="mt-1 text-xs text-red-600">{fieldErrors.company}</p> : null}
                </div>
                <div>
                  <label htmlFor="contactPerson" className={labelClass}>Contact person</label>
                  <input id="contactPerson" name="contactPerson" required className={inputClass} />
                  {fieldErrors.contactPerson ? <p className="mt-1 text-xs text-red-600">{fieldErrors.contactPerson}</p> : null}
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>Email</label>
                  <input id="email" name="email" type="email" required className={inputClass} />
                  {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone</label>
                  <input id="phone" name="phone" type="tel" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="website" className={labelClass}>Website</label>
                  <input id="website" name="website" type="url" placeholder="https://" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="package" className={labelClass}>Package</label>
                  <select id="package" name="package" required className={inputClass}>
                    {SPONSOR_TIERS.map((t) => (
                      <option key={t.tier} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="logo" className={labelClass}>Logo upload</label>
                <input id="logo" name="logo" type="file" accept="image/*" className={inputClass} onChange={handleLogoChange} />
              </div>
              <div>
                <label htmlFor="message" className={labelClass}>Message</label>
                <textarea id="message" name="message" rows={4} className={inputClass} />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting…" : "Submit sponsorship enquiry"}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
