"use client";

import { useState, useTransition } from "react";
import { editRsvpDetailsAction } from "@/app/actions/dashboard-rsvp";
import { ModalShell } from "@/components/dashboard/ModalShell";
import { ToolbarButton } from "@/components/dashboard/dashboard-ui";
import { TICKET_TYPES } from "@/lib/site";
import type { DashboardRsvpRecord } from "@/platform/engines/dashboard/rsvp/types";

const fieldClass =
  "mt-1 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-3 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10";
const labelClass = "font-sans text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/45";

type Props = {
  record: DashboardRsvpRecord;
  onClose: () => void;
  onSaved?: () => void;
};

export function EditRsvpDialog({ record, onClose, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await editRsvpDetailsAction({
        id: record.id,
        fullName: String(fd.get("fullName") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? "") || undefined,
        numberOfAttendees: Number(fd.get("numberOfAttendees") ?? 1),
        ticketType: String(fd.get("ticketType") ?? ""),
        notes: String(fd.get("notes") ?? "") || undefined,
        accessibilityRequirements: String(fd.get("accessibilityRequirements") ?? "") || undefined,
        dietaryRequirements: String(fd.get("dietaryRequirements") ?? "") || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved?.();
      onClose();
    });
  }

  return (
    <ModalShell title="Edit guest details" showTitle onClose={onClose} className="max-w-lg">
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <label className="block">
          <span className={labelClass}>Full name</span>
          <input name="fullName" required defaultValue={record.fullName} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Email</span>
          <input name="email" type="email" required defaultValue={record.email} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Phone</span>
          <input name="phone" defaultValue={record.phone ?? ""} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Guests</span>
            <input
              name="numberOfAttendees"
              type="number"
              min={1}
              max={50}
              required
              defaultValue={record.numberOfAttendees}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Ticket preference</span>
            <select name="ticketType" className={fieldClass} defaultValue={record.ticketType ?? TICKET_TYPES[0]}>
              {TICKET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className={labelClass}>Accessibility</span>
          <textarea
            name="accessibilityRequirements"
            rows={2}
            defaultValue={record.accessibilityRequirements ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Dietary</span>
          <textarea
            name="dietaryRequirements"
            rows={2}
            defaultValue={record.dietaryRequirements ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Guest notes</span>
          <textarea name="notes" rows={2} defaultValue={record.notes ?? ""} className={fieldClass} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <ToolbarButton type="button" onClick={onClose}>Cancel</ToolbarButton>
          <ToolbarButton primary type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </ToolbarButton>
        </div>
      </form>
    </ModalShell>
  );
}
