"use client";

import { type FormEvent, useState } from "react";
import { submitSponsorAction } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/Button";
import { SPONSOR_TIERS, LAUNCH_COPY } from "@/lib/site";

const field =
  "w-full rounded-2xl border border-mahogany/12 bg-cream/90 px-4 py-3 font-sans text-sm text-mahogany outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/15";
const label =
  "mb-2 block font-sans text-[0.62rem] font-bold uppercase tracking-[0.2em] text-mahogany/55";

export function SponsorEnquiryForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    package: SPONSOR_TIERS[0]?.name ?? "",
    message: "",
    logoUrl: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await submitSponsorAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      setForm({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        website: "",
        package: SPONSOR_TIERS[0]?.name ?? "",
        message: "",
        logoUrl: "",
      });
    } catch {
      setError("Something went wrong while submitting your enquiry. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto mt-14 max-w-3xl rounded-[1.5rem] border border-mahogany/10 bg-white/70 p-6 shadow-[var(--shadow-card-light)] sm:p-8">
      <h3 className="font-display text-2xl font-semibold text-mahogany">Sponsorship enquiry</h3>
      <p className="mt-2 font-sans text-sm text-mahogany/65">
        {LAUNCH_COPY.sponsorshipAnnouncedSoon} Share your details and our partnerships team will
        follow up.
      </p>

      {done ? (
        <p
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          Thank you — your sponsorship enquiry has been received.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="sponsor-company" className={label}>
            Company name
          </label>
          <input
            id="sponsor-company"
            required
            className={field}
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="sponsor-contact" className={label}>
            Contact person
          </label>
          <input
            id="sponsor-contact"
            required
            className={field}
            value={form.contactPerson}
            onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="sponsor-email" className={label}>
            Email
          </label>
          <input
            id="sponsor-email"
            type="email"
            required
            className={field}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="sponsor-phone" className={label}>
            Phone
          </label>
          <input
            id="sponsor-phone"
            className={field}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="sponsor-website" className={label}>
            Website
          </label>
          <input
            id="sponsor-website"
            className={field}
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="sponsor-package" className={label}>
            Sponsor package
          </label>
          <select
            id="sponsor-package"
            required
            className={field}
            value={form.package}
            onChange={(e) => setForm((f) => ({ ...f, package: e.target.value }))}
          >
            {SPONSOR_TIERS.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sponsor-logo" className={label}>
            Logo URL
          </label>
          <input
            id="sponsor-logo"
            className={field}
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://…"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sponsor-message" className={label}>
            Message
          </label>
          <textarea
            id="sponsor-message"
            rows={4}
            className={field}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending} className="!text-espresso">
            {pending ? "Submitting…" : "Submit enquiry"}
          </Button>
        </div>
      </form>
    </div>
  );
}
