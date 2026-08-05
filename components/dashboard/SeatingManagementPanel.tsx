"use client";

import { useMemo, useState, useTransition } from "react";
import {
  assignSeatAction,
  createTableAction,
  saveFloorPlanAction,
} from "@/app/actions/seating";
import {
  EmptyState,
  PageToolbar,
  SectionHeader,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import { downloadCsvFile } from "@/lib/export/csv";
import {
  SEATING_ZONES,
  type SeatingAssignment,
  type SeatingTable,
  type VenueFloorPlan,
} from "@/platform/engines/seating/types";

type GuestOption = {
  id: string;
  fullName: string;
  email: string;
  reference: string | null;
  status: string;
};

const field =
  "rounded-lg border border-mahogany/10 bg-white px-3 py-2 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10";

export function SeatingManagementPanel({
  tables,
  assignments,
  floorPlans,
  guests,
}: {
  tables: SeatingTable[];
  assignments: SeatingAssignment[];
  floorPlans: VenueFloorPlan[];
  guests: GuestOption[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const activePlan = floorPlans.find((p) => p.isActive) ?? floorPlans[0] ?? null;

  const unassignedGuests = useMemo(() => {
    const assigned = new Set(assignments.map((a) => a.rsvpId));
    return guests.filter((g) => g.status !== "cancelled" && !assigned.has(g.id));
  }, [assignments, guests]);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else setMessage(success);
    });
  }

  function exportStewardList() {
    const header = [
      "Name",
      "Email",
      "Reference",
      "Zone",
      "Table",
      "Seat",
      "Ticket",
      "Accessibility",
      "Checked in",
      "QR token (suffix)",
    ];
    const rows = assignments.map((a) => [
      a.guestName,
      a.guestEmail,
      a.registrationReference ?? "",
      a.zone ?? "",
      a.tableName ?? "",
      a.seatLabel ?? "",
      a.ticketType ?? "",
      a.accessibilityRequirements ?? "",
      a.checkedInAt ? "Yes" : "No",
      a.qrToken.slice(-8),
    ]);
    downloadCsvFile(`steward-list-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Seating MVP"
        description="Upload a hall floor-plan reference, define tables by zone, assign guests, generate QR tokens, and export a steward list. Drag-and-drop designer comes later."
      />

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}

      <section className="rounded-2xl border border-mahogany/[0.06] bg-white p-5 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-mahogany">Floor plan reference</h3>
        <p className="mt-1 font-sans text-sm text-mahogany/60">
          Paste a secure public URL or hosted file reference (image/PDF). Do not store private credentials.
        </p>
        {activePlan ? (
          <p className="mt-3 font-sans text-sm text-mahogany/75">
            Active: <strong>{activePlan.title}</strong>
            {activePlan.fileUrl ? (
              <>
                {" "}
                ·{" "}
                <a href={activePlan.fileUrl} className="text-gold-deep underline" target="_blank" rel="noreferrer">
                  Open plan
                </a>
              </>
            ) : null}
          </p>
        ) : (
          <p className="mt-3 text-sm text-mahogany/45">No floor plan uploaded yet.</p>
        )}
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(
              () =>
                saveFloorPlanAction({
                  title: String(fd.get("title") ?? "Main hall"),
                  fileUrl: String(fd.get("fileUrl") ?? ""),
                  fileLabel: String(fd.get("fileLabel") ?? "") || undefined,
                  notes: String(fd.get("notes") ?? "") || undefined,
                }),
              "Floor plan saved.",
            );
          }}
        >
          <input name="title" placeholder="Title" defaultValue="Main hall" className={field} />
          <input name="fileLabel" placeholder="Label (optional)" className={field} />
          <input name="fileUrl" required placeholder="https://… or storage path reference" className={`${field} sm:col-span-2`} />
          <input name="notes" placeholder="Notes (optional)" className={`${field} sm:col-span-2`} />
          <ToolbarButton primary type="submit" disabled={isPending}>
            Save floor plan
          </ToolbarButton>
        </form>
      </section>

      <section className="rounded-2xl border border-mahogany/[0.06] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-mahogany">Tables & zones</h3>
          <ToolbarButton onClick={exportStewardList} disabled={assignments.length === 0}>
            Export steward list
          </ToolbarButton>
        </div>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(
              () =>
                createTableAction({
                  name: String(fd.get("name") ?? ""),
                  zone: String(fd.get("zone") ?? "General"),
                  capacity: Number(fd.get("capacity") ?? 8),
                }),
              "Table created.",
            );
            e.currentTarget.reset();
          }}
        >
          <input name="name" required placeholder="Table name e.g. Table 7" className={field} />
          <select name="zone" className={field} defaultValue="General">
            {SEATING_ZONES.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <input name="capacity" type="number" min={1} max={100} defaultValue={8} className={`${field} w-24`} />
          <ToolbarButton primary type="submit" disabled={isPending}>Add table</ToolbarButton>
        </form>
        {tables.length === 0 ? (
          <EmptyState title="No tables yet" message="Create tables for VIP, Elders, Families, Sponsors and more." />
        ) : (
          <ul className="mt-4 divide-y divide-mahogany/[0.05]">
            {tables.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3 font-sans text-sm">
                <span className="font-semibold text-mahogany">{t.name}</span>
                <span className="text-mahogany/55">{t.zone}</span>
                <span className="text-mahogany/70">
                  {t.assignedCount}/{t.capacity} seated
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-mahogany/[0.06] bg-white p-5 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-mahogany">Assign guest seat</h3>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(
              () =>
                assignSeatAction({
                  rsvpId: String(fd.get("rsvpId") ?? ""),
                  tableId: String(fd.get("tableId") ?? ""),
                  seatLabel: String(fd.get("seatLabel") ?? "1"),
                  zone: String(fd.get("zone") ?? "") || undefined,
                }),
              "Seat assigned and QR token generated.",
            );
          }}
        >
          <select name="rsvpId" required className={field} defaultValue="">
            <option value="" disabled>
              Select guest ({unassignedGuests.length} unassigned)
            </option>
            {unassignedGuests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.fullName} · {g.reference ?? g.email}
              </option>
            ))}
          </select>
          <select name="tableId" required className={field} defaultValue="">
            <option value="" disabled>
              Select table
            </option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.zone}) — {t.assignedCount}/{t.capacity}
              </option>
            ))}
          </select>
          <input name="seatLabel" required placeholder="Seat e.g. 3" defaultValue="1" className={field} />
          <select name="zone" className={field} defaultValue="">
            <option value="">Zone from table</option>
            {SEATING_ZONES.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <ToolbarButton primary type="submit" disabled={isPending || tables.length === 0}>
            Assign + generate QR
          </ToolbarButton>
        </form>

        <div className="mt-6">
          <PageToolbar>
            <p className="font-sans text-sm text-mahogany/60">
              {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
            </p>
          </PageToolbar>
          {assignments.length === 0 ? (
            <EmptyState title="No seats assigned" message="Assign confirmed guests to tables to generate personal QR tokens." />
          ) : (
            <ul className="mt-3 divide-y divide-mahogany/[0.05]">
              {assignments.slice(0, 40).map((a) => (
                <li key={a.id} className="py-3 font-sans text-sm">
                  <p className="font-semibold text-mahogany">{a.guestName}</p>
                  <p className="text-mahogany/55">
                    {[a.zone, a.tableName, a.seatLabel ? `Seat ${a.seatLabel}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                    {a.checkedInAt ? " · Checked in" : ""}
                  </p>
                  <p className="mt-1 font-mono text-[0.65rem] text-mahogany/40">
                    QR …{a.qrToken.slice(-8)} · {a.registrationReference ?? "no ref"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
