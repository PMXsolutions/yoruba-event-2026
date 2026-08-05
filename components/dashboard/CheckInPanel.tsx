"use client";

import { useMemo, useState, useTransition } from "react";
import { setCheckInAction } from "@/app/actions/seating";
import { EmptyState, SectionHeader, ToolbarButton } from "@/components/dashboard/dashboard-ui";
import { downloadCsvFile } from "@/lib/export/csv";
import type { SeatingAssignment } from "@/platform/engines/seating/types";

export function CheckInPanel({ assignments }: { assignments: SeatingAssignment[] }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter(
      (a) =>
        a.guestName.toLowerCase().includes(q) ||
        a.guestEmail.toLowerCase().includes(q) ||
        (a.registrationReference?.toLowerCase().includes(q) ?? false) ||
        a.qrToken.toLowerCase().includes(q) ||
        (a.tableName?.toLowerCase().includes(q) ?? false),
    );
  }, [assignments, query]);

  function toggle(id: string, checkedIn: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await setCheckInAction(id, checkedIn);
      if (!res.ok) setError(res.error ?? "Check-in failed.");
    });
  }

  function exportStewardList() {
    const header = [
      "Name",
      "Table",
      "Seat",
      "Zone",
      "Accessibility",
      "Check-in status",
      "Reference",
    ];
    const rows = filtered.map((a) => [
      a.guestName,
      a.tableName ?? "",
      a.seatLabel ?? "",
      a.zone ?? "",
      a.accessibilityRequirements ?? "",
      a.checkedInAt ? "Arrived" : "Not checked in",
      a.registrationReference ?? "",
    ]);
    downloadCsvFile(
      `steward-checkin-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows],
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Check-in"
        description="Search by name or booking reference. QR camera scan can be added via supported browsers — paste QR token suffix for now."
      />
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, reference, table, or QR token…"
          className="w-full flex-1 rounded-xl border border-mahogany/10 bg-white px-4 py-3 font-sans text-sm outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10"
        />
        <ToolbarButton onClick={exportStewardList} disabled={filtered.length === 0}>
          Export steward list
        </ToolbarButton>
      </div>
      <p className="font-sans text-xs text-mahogany/45">
        QR scan placeholder: paste the guest QR token (or last characters) into search when scanning
        hardware is unavailable. Printable steward export includes name, table, seat, zone,
        accessibility and check-in status.
      </p>
      {filtered.length === 0 ? (
        <EmptyState
          title="No matching assignments"
          message="Assign seats in Seating first, then return here to check guests in."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 rounded-2xl border border-mahogany/[0.06] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-sans text-sm font-semibold text-mahogany">{a.guestName}</p>
                <p className="font-sans text-xs text-mahogany/55">
                  {[a.zone, a.tableName, a.seatLabel ? `Seat ${a.seatLabel}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                  {a.checkedInAt ? " · Arrived" : ""}
                </p>
                {a.accessibilityRequirements ? (
                  <p className="mt-1 font-sans text-xs text-amber-800">
                    Accessibility: {a.accessibilityRequirements}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                {a.checkedInAt ? (
                  <ToolbarButton disabled={isPending} onClick={() => toggle(a.id, false)}>
                    Undo check-in
                  </ToolbarButton>
                ) : (
                  <ToolbarButton primary disabled={isPending} onClick={() => toggle(a.id, true)}>
                    Mark arrived
                  </ToolbarButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
