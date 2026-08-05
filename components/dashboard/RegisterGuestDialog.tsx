"use client";

import { useState, useTransition } from "react";
import { registerCommitteeGuestAction } from "@/app/actions/dashboard-rsvp";
import { ModalShell } from "@/components/dashboard/ModalShell";
import { ToolbarButton } from "@/components/dashboard/dashboard-ui";
import { TICKET_TYPES } from "@/lib/site";
import {
  RSVP_STATUSES,
  RSVP_TAGS,
  formatRsvpStatusLabel,
  type RsvpStatus,
  type RsvpTag,
} from "@/platform/engines/dashboard/rsvp/types";

const fieldClass =
  "mt-1 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-3 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10";
const labelClass = "font-sans text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/45";

type Props = {
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

export function RegisterGuestDialog({ onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<RsvpTag[]>([]);
  const [status, setStatus] = useState<RsvpStatus>("new");
  const [sendEmail, setSendEmail] = useState(true);

  function toggleTag(tag: RsvpTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registerCommitteeGuestAction({
        fullName: String(fd.get("fullName") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? "") || undefined,
        numberOfAttendees: Number(fd.get("numberOfAttendees") ?? 1),
        ticketType: String(fd.get("ticketType") ?? TICKET_TYPES[0]),
        status,
        tags,
        committeeNotes: String(fd.get("committeeNotes") ?? "") || undefined,
        accessibilityRequirements: String(fd.get("accessibilityRequirements") ?? "") || undefined,
        dietaryRequirements: String(fd.get("dietaryRequirements") ?? "") || undefined,
        notes: String(fd.get("notes") ?? "") || undefined,
        source: String(fd.get("source") ?? "committee"),
        sendEmail,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuccess?.(
        result.emailSent
          ? `Guest registered (${result.registrationReference}). Confirmation email sent.`
          : `Guest registered (${result.registrationReference}).`,
      );
      onClose();
    });
  }

  return (
    <ModalShell title="Register Guest" showTitle onClose={onClose} className="max-w-xl">
      <p className="mt-2 font-sans text-sm text-mahogany/60">
        Manually register VIP guests, elders, performers, phone or walk-in registrations. This is
        interest / guest capture — not a paid ticket.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Full name</span>
            <input name="fullName" required className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input name="email" type="email" required className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Phone</span>
            <input name="phone" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Number of guests</span>
            <input name="numberOfAttendees" type="number" min={1} max={50} defaultValue={1} required className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Ticket preference</span>
            <select name="ticketType" className={fieldClass} defaultValue={TICKET_TYPES[0]}>
              {TICKET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Status</span>
            <select
              className={fieldClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as RsvpStatus)}
            >
              {RSVP_STATUSES.map((s) => (
                <option key={s} value={s}>{formatRsvpStatusLabel(s)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Source</span>
            <select name="source" className={fieldClass} defaultValue="committee">
              <option value="committee">Committee</option>
              <option value="phone">Phone</option>
              <option value="walk_in">Walk-in</option>
            </select>
          </label>
        </div>
        <div>
          <p className={labelClass}>Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {RSVP_TAGS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 font-sans text-xs font-semibold ${
                    on
                      ? "border-gold/40 bg-gold/15 text-mahogany"
                      : "border-mahogany/10 bg-white text-mahogany/60"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
        <label className="block">
          <span className={labelClass}>Committee notes</span>
          <textarea name="committeeNotes" rows={2} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Accessibility requirements</span>
          <textarea name="accessibilityRequirements" rows={2} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Dietary requirements</span>
          <textarea name="dietaryRequirements" rows={2} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Guest message / notes</span>
          <textarea name="notes" rows={2} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 font-sans text-sm text-mahogany/70">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
          />
          Send confirmation email when configured
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <ToolbarButton type="button" onClick={onClose}>Cancel</ToolbarButton>
          <ToolbarButton primary type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Register guest"}
          </ToolbarButton>
        </div>
      </form>
    </ModalShell>
  );
}
