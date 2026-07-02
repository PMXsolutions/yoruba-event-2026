"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteRsvp, sendRsvpEmail } from "@/app/actions/dashboard";
import type { RsvpRow } from "@/lib/database/types";

type RsvpManagementProps = {
  initialRsvps: RsvpRow[];
};

export function RsvpManagement({ initialRsvps }: RsvpManagementProps) {
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [search, setSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [selected, setSelected] = useState<RsvpRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const ticketTypes = useMemo(
    () => [...new Set(rsvps.map((r) => r.ticket_type))],
    [rsvps],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rsvps.filter((r) => {
      const matchesSearch =
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.registration_reference ?? "").toLowerCase().includes(q);
      const matchesTicket = ticketFilter === "all" || r.ticket_type === ticketFilter;
      return matchesSearch && matchesTicket;
    });
  }, [rsvps, search, ticketFilter]);

  function exportCsv() {
    const header = ["reference", "name", "email", "phone", "attendees", "ticket_type", "created_at"];
    const lines = [
      header.join(","),
      ...filtered.map((r) =>
        [
          r.registration_reference,
          r.full_name,
          r.email,
          r.phone,
          r.number_of_attendees,
          r.ticket_type,
          r.created_at,
        ]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvps-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this RSVP? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteRsvp(id);
      setRsvps((prev) => prev.filter((r) => r.id !== id));
      setSelected(null);
    });
  }

  function handleSendEmail() {
    if (!selected) return;
    const subject = prompt("Email subject:");
    const body = prompt("Email message:");
    if (!subject || !body) return;
    startTransition(async () => {
      await sendRsvpEmail(selected.id, subject, body);
      alert("Email sent.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          placeholder="Search name, email, reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[14rem] flex-1 rounded-xl border border-mahogany/12 bg-white px-4 py-2.5 font-sans text-sm outline-none focus:border-gold/40"
          aria-label="Search RSVPs"
        />
        <select
          value={ticketFilter}
          onChange={(e) => setTicketFilter(e.target.value)}
          className="rounded-xl border border-mahogany/12 bg-white px-4 py-2.5 font-sans text-sm"
          aria-label="Filter by ticket type"
        >
          <option value="all">All ticket types</option>
          {ticketTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-xl border border-mahogany/12 bg-white px-5 py-2.5 font-sans text-sm font-semibold text-mahogany hover:bg-cream"
        >
          Export CSV
        </button>
        <a
          href="/api/dashboard/export/rsvps?format=xlsx"
          className="rounded-xl border border-mahogany/12 bg-espresso px-5 py-2.5 font-sans text-sm font-semibold text-cream hover:bg-mahogany"
        >
          Export Excel
        </a>
      </div>

      <p className="font-sans text-sm text-mahogany/60">
        Showing {filtered.length} of {rsvps.length} registrations
      </p>

      <div className="overflow-hidden rounded-2xl border border-mahogany/8 bg-white shadow-[var(--shadow-card-light)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-mahogany/8 bg-cream/50">
                {["Reference", "Name", "Email", "Guests", "Ticket", "Registered", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-mahogany/50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-mahogany/5 hover:bg-cream/30">
                  <td className="px-4 py-3 font-mono text-xs text-mahogany/70">{r.registration_reference ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-mahogany">{r.full_name}</td>
                  <td className="px-4 py-3 text-mahogany/75">{r.email}</td>
                  <td className="px-4 py-3">{r.number_of_attendees}</td>
                  <td className="px-4 py-3 text-mahogany/75">{r.ticket_type}</td>
                  <td className="px-4 py-3 text-mahogany/60">{new Date(r.created_at).toLocaleDateString("en-AU")}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className="text-xs font-semibold text-gold-deep hover:text-gold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div className="rounded-2xl border border-mahogany/8 bg-white p-6 shadow-[var(--shadow-card-light)]">
          <h3 className="font-display text-xl font-semibold text-mahogany">{selected.full_name}</h3>
          <dl className="mt-4 grid gap-3 font-sans text-sm sm:grid-cols-2">
            <div><dt className="text-mahogany/50">Reference</dt><dd className="font-mono">{selected.registration_reference}</dd></div>
            <div><dt className="text-mahogany/50">Email</dt><dd>{selected.email}</dd></div>
            <div><dt className="text-mahogany/50">Phone</dt><dd>{selected.phone ?? "—"}</dd></div>
            <div><dt className="text-mahogany/50">Guests</dt><dd>{selected.number_of_attendees}</dd></div>
            <div><dt className="text-mahogany/50">Ticket</dt><dd>{selected.ticket_type}</dd></div>
            <div className="sm:col-span-2"><dt className="text-mahogany/50">Notes</dt><dd>{selected.notes ?? "—"}</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isPending}
              className="rounded-full border border-mahogany/15 px-5 py-2 font-sans text-xs font-semibold uppercase tracking-wide text-mahogany hover:bg-cream"
            >
              Send email
            </button>
            <button
              type="button"
              onClick={() => handleDelete(selected.id)}
              disabled={isPending}
              className="rounded-full border border-red-200 px-5 py-2 font-sans text-xs font-semibold uppercase tracking-wide text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
            <button type="button" onClick={() => setSelected(null)} className="font-sans text-xs text-mahogany/50">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
