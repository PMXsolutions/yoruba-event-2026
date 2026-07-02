"use client";

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { submitRsvp } from "@/app/actions/rsvp";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LAUNCH_COPY, TICKET_TYPES } from "@/lib/site";
import { EASE_LUX } from "@/lib/motion";
import {
  fieldErrorsFromZod,
  rsvpFormSchema,
  type RsvpFormValues,
} from "@/lib/validation/rsvp";

const RSVP_SUBTITLE =
  "Register your interest and our planning committee will share ticketing and event updates as details are confirmed.";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  attendees: string;
  ticketType: string;
  notes: string;
};

const initial: FormState = {
  fullName: "",
  email: "",
  phone: "",
  attendees: "1",
  ticketType: TICKET_TYPES[0],
  notes: "",
};

const fieldWrap = "group relative";
const labelClass =
  "mb-2.5 block font-sans text-[0.62rem] font-bold uppercase tracking-[0.24em] text-gold-muted transition-colors duration-300 group-focus-within:text-gold-bright sm:text-[0.65rem]";
const inputBase =
  "peer w-full rounded-2xl border bg-mahogany/50 px-5 py-4 font-sans text-[0.95rem] text-cream shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)] outline-none transition-all duration-300 placeholder:text-cream/30 hover:border-gold/25 hover:bg-mahogany/65 focus:border-gold-bright/55 focus:bg-espresso/90 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_3px_rgba(201,162,39,0.12),0_20px_48px_-28px_rgba(0,0,0,0.55)] focus:ring-0 sm:py-[1.125rem]";
const inputNormal = `${inputBase} border-white/[0.08]`;
const inputError = `${inputBase} border-red-400/45 ring-1 ring-red-400/20`;
const selectClass = `${inputNormal} cursor-pointer appearance-none bg-[length:1.1rem] bg-[right_1.1rem_center] bg-no-repeat pr-12`;

const errText = "mt-2 font-sans text-xs leading-snug text-red-300/95";
const alertBox =
  "rounded-2xl border border-red-400/35 bg-red-950/35 px-5 py-4 font-sans text-sm leading-relaxed text-red-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
const successBox =
  "rounded-2xl border border-gold/25 bg-gold/[0.08] px-5 py-4 font-sans text-sm leading-relaxed text-cream/90";

function inputClass(err?: string) {
  return err ? inputError : inputNormal;
}

export function RSVP() {
  const [form, setForm] = useState<FormState>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RsvpFormValues, string>>
  >({});
  const [isPending, setIsPending] = useState(false);
  const [confirmationEmailQueued, setConfirmationEmailQueued] = useState(false);

  function clearMessages() {
    setSubmitError(null);
    setFieldErrors({});
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();

    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      attendees: form.attendees,
      ticketType: form.ticketType,
      notes: form.notes,
    };

    const local = rsvpFormSchema.safeParse(payload);
    if (!local.success) {
      setFieldErrors(fieldErrorsFromZod(local.error));
      setSubmitError("Please correct the highlighted fields below—we are almost there.");
      return;
    }

    setIsPending(true);
    try {
      const serializable = {
        ...local.data,
        phone: local.data.phone ?? "",
        notes: local.data.notes ?? "",
      };
      const result = await submitRsvp(serializable);
      if (result.ok) {
        setSubmitted(true);
        setConfirmationEmailQueued(result.emailSent ?? false);
        setForm(initial);
        setFieldErrors({});
        setSubmitError(null);
        return;
      }
      setSubmitError(result.error);
      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        setFieldErrors(result.fieldErrors);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AnimatedSection
      id="rsvp"
      className="relative scroll-mt-24 overflow-x-clip bg-gradient-to-b from-espresso via-mahogany to-espresso py-20 pb-24 sm:py-28 sm:pb-32 md:py-32 md:pb-36"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_85%_15%,rgba(201,162,39,0.14),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-motif-textile opacity-35 mix-blend-soft-light" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.08fr] lg:items-start lg:gap-16 xl:gap-20">
          <div className="lg:pt-4">
            <SectionHeading
              align="left"
              eyebrow="Register your interest"
              title="Join us for an evening draped in gold and grace"
              subtitle={RSVP_SUBTITLE}
            />
            <ul className="mt-8 space-y-5 font-sans text-sm leading-relaxed text-cream/75 sm:mt-10 sm:text-[0.95rem]">
              {[
                "Share your details once—our planning committee will follow up as the programme firms.",
                "Let us know your party size and preferred ticket type so we can plan seating fairly.",
                "Corporate tables and sponsorship conversations can begin in parallel—no obligation at this stage.",
              ].map((line) => (
                <li key={line} className="flex gap-4">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-gold-bright to-gold-deep shadow-[0_0_12px_rgba(201,162,39,0.5)]" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-8 rounded-2xl border border-gold/20 bg-mahogany/40 px-5 py-4 font-sans text-xs leading-relaxed text-cream/70 shadow-inner backdrop-blur-sm sm:mt-10 sm:text-sm">
              {LAUNCH_COPY.comingSoonNote}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.75, ease: EASE_LUX }}
            className="relative min-w-0"
          >
            <div className="pointer-events-none absolute -inset-px rounded-[1.75rem] bg-gradient-to-br from-gold-bright/25 via-gold/10 to-transparent opacity-70 blur-sm sm:rounded-[2rem]" />
            <div className="relative overflow-visible rounded-[1.75rem] border border-gold/20 bg-gradient-to-b from-mahogany/80 to-espresso/95 p-6 shadow-[var(--shadow-card-dark)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8 md:p-10">
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-motif-geo opacity-[0.1]" />
              <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-gold-bright/10 blur-[100px]" />

              {submitted ? (
                <div className="relative py-10 text-center sm:py-14">
                  <div className={successBox}>
                    <p className="font-display text-2xl font-medium text-cream sm:text-3xl">
                      Thank you — you are on the list
                    </p>
                    <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-relaxed text-cream/78 sm:text-base">
                      Your interest has been received and stored securely. Our planning committee
                      will reach out to the email you provided with ticketing and programme news as
                      soon as dates and venues are finalised.
                    </p>
                    {confirmationEmailQueued ? (
                      <p className="mx-auto mt-3 max-w-md font-sans text-xs text-cream/60">
                        A confirmation email is on its way to your inbox.
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-8"
                    onClick={() => {
                      setSubmitted(false);
                      setConfirmationEmailQueued(false);
                      setForm(initial);
                      clearMessages();
                    }}
                  >
                    Register another guest
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="relative space-y-6 sm:space-y-7">
                  {submitError ? (
                    <div role="alert" className={alertBox}>
                      {submitError}
                    </div>
                  ) : null}

                  <div className={fieldWrap}>
                    <label htmlFor="fullName" className={labelClass}>
                      Full name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      required
                      autoComplete="name"
                      className={inputClass(fieldErrors.fullName)}
                      placeholder="Adeola Ogunbiyi"
                      value={form.fullName}
                      onChange={(e) => {
                        clearMessages();
                        setForm((f) => ({ ...f, fullName: e.target.value }));
                      }}
                    />
                    {fieldErrors.fullName ? (
                      <p className={errText}>{fieldErrors.fullName}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 sm:gap-7">
                    <div className={fieldWrap}>
                      <label htmlFor="email" className={labelClass}>
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className={inputClass(fieldErrors.email)}
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => {
                          clearMessages();
                          setForm((f) => ({ ...f, email: e.target.value }));
                        }}
                      />
                      {fieldErrors.email ? (
                        <p className={errText}>{fieldErrors.email}</p>
                      ) : null}
                    </div>
                    <div className={fieldWrap}>
                      <label htmlFor="phone" className={labelClass}>
                        Phone <span className="font-normal text-cream/45">(optional)</span>
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        className={inputClass(fieldErrors.phone)}
                        placeholder="+61 …"
                        value={form.phone}
                        onChange={(e) => {
                          clearMessages();
                          setForm((f) => ({ ...f, phone: e.target.value }));
                        }}
                      />
                      {fieldErrors.phone ? (
                        <p className={errText}>{fieldErrors.phone}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 sm:gap-7">
                    <div className={fieldWrap}>
                      <label htmlFor="attendees" className={labelClass}>
                        Number of attendees
                      </label>
                      <input
                        id="attendees"
                        name="attendees"
                        type="number"
                        min={1}
                        max={50}
                        required
                        className={inputClass(fieldErrors.attendees)}
                        value={form.attendees}
                        onChange={(e) => {
                          clearMessages();
                          setForm((f) => ({ ...f, attendees: e.target.value }));
                        }}
                      />
                      {fieldErrors.attendees ? (
                        <p className={errText}>{fieldErrors.attendees}</p>
                      ) : null}
                    </div>
                    <div className={fieldWrap}>
                      <label htmlFor="ticketType" className={labelClass}>
                        Preferred ticket type
                      </label>
                      <select
                        id="ticketType"
                        name="ticketType"
                        className={
                          fieldErrors.ticketType
                            ? `${inputError} cursor-pointer appearance-none bg-[length:1.1rem] bg-[right_1.1rem_center] bg-no-repeat pr-12`
                            : selectClass
                        }
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23e4c76a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                        }}
                        value={form.ticketType}
                        onChange={(e) => {
                          clearMessages();
                          setForm((f) => ({ ...f, ticketType: e.target.value }));
                        }}
                      >
                        {TICKET_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-espresso text-cream">
                            {t}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.ticketType ? (
                        <p className={errText}>{fieldErrors.ticketType}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className={fieldWrap}>
                    <label htmlFor="notes" className={labelClass}>
                      Notes <span className="font-normal text-cream/45">(optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      className={`${inputClass(fieldErrors.notes)} min-h-[6.5rem] resize-y sm:min-h-[7rem]`}
                      placeholder="Dietary needs, accessibility, or a short message for the committee…"
                      value={form.notes}
                      onChange={(e) => {
                        clearMessages();
                        setForm((f) => ({ ...f, notes: e.target.value }));
                      }}
                    />
                    {fieldErrors.notes ? (
                      <p className={errText}>{fieldErrors.notes}</p>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-gold/15 bg-espresso/40 px-4 py-3 font-sans text-xs leading-relaxed text-cream/60 sm:text-[0.8rem]">
                    {LAUNCH_COPY.comingSoonNote}
                  </div>
                  <div className="border-t border-white/10 pt-6 pb-2 sm:pt-7">
                    <Button
                      type="submit"
                      className="w-full min-h-[3.25rem] sm:w-auto sm:min-w-[14rem]"
                      disabled={isPending}
                    >
                      {isPending ? "Sending…" : LAUNCH_COPY.registerInterest}
                    </Button>
                    <p className="mt-4 max-w-lg font-sans text-xs leading-relaxed text-cream/45 sm:mt-5 sm:text-[0.8rem]">
                      By submitting, you agree to be contacted about Yoruba Day Canberra 2026.
                      This form registers interest only; ticketing will open separately once
                      confirmed.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
