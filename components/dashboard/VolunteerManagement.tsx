"use client";

import { useState, useTransition } from "react";
import { updateVolunteer } from "@/app/actions/dashboard";
import type { VolunteerRow } from "@/lib/database/types";

export function VolunteerManagement({ initialVolunteers }: { initialVolunteers: VolunteerRow[] }) {
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [isPending, startTransition] = useTransition();

  function assign(id: string) {
    const assignment = prompt("Assignment (e.g. Registration desk, Stage support):");
    if (!assignment) return;
    startTransition(async () => {
      await updateVolunteer(id, { status: "assigned", assignment });
      setVolunteers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "assigned", assignment } : v)),
      );
    });
  }

  return (
    <div className="space-y-4">
      {volunteers.map((v) => (
        <article key={v.id} className="rounded-2xl border border-mahogany/8 bg-white p-5 shadow-[var(--shadow-card-light)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-mahogany">{v.full_name}</h3>
              <p className="font-sans text-sm text-mahogany/70">{v.email} {v.phone ? `· ${v.phone}` : ""}</p>
              {v.skills?.length ? (
                <p className="mt-2 font-sans text-xs text-mahogany/60">Skills: {v.skills.join(", ")}</p>
              ) : null}
              {v.availability ? (
                <p className="mt-1 font-sans text-xs text-mahogany/60">Availability: {v.availability}</p>
              ) : null}
              {v.assignment ? (
                <p className="mt-2 font-sans text-sm font-medium text-gold-deep">Assigned: {v.assignment}</p>
              ) : null}
            </div>
            <span className="rounded-full bg-cream px-3 py-1 font-sans text-xs font-semibold uppercase text-mahogany/70">
              {v.status}
            </span>
          </div>
          {v.status === "pending" || v.status === "approved" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => assign(v.id)}
              className="mt-4 rounded-full border border-mahogany/15 px-4 py-2 font-sans text-xs font-semibold text-mahogany hover:bg-cream"
            >
              Assign role
            </button>
          ) : null}
        </article>
      ))}
      {volunteers.length === 0 ? (
        <p className="font-sans text-sm text-mahogany/50">No volunteer registrations yet.</p>
      ) : null}
    </div>
  );
}
