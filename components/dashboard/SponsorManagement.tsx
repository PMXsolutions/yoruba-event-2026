"use client";

import { useState, useTransition } from "react";
import { updateSponsorStatus } from "@/app/actions/dashboard";
import type { SponsorRow } from "@/lib/database/types";

export function SponsorManagement({ initialSponsors }: { initialSponsors: SponsorRow[] }) {
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isPending, startTransition] = useTransition();

  const filtered = sponsors.filter((s) => filter === "all" || s.status === filter);

  function handleStatus(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      await updateSponsorStatus(id, status);
      setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    });
  }

  function exportCsv() {
    const header = ["company", "contact", "email", "package", "status", "created_at"];
    const lines = [
      header.join(","),
      ...filtered.map((s) =>
        [s.company, s.contact_person, s.email, s.package, s.status, s.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sponsors-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wide ${
              filter === f ? "bg-espresso text-cream" : "border border-mahogany/15 bg-white text-mahogany"
            }`}
          >
            {f}
          </button>
        ))}
        <button type="button" onClick={exportCsv} className="ml-auto rounded-full border border-mahogany/15 bg-white px-4 py-2 font-sans text-xs font-semibold text-mahogany">
          Export CSV
        </button>
      </div>

      <div className="space-y-4">
        {filtered.map((s) => (
          <article key={s.id} className="rounded-2xl border border-mahogany/8 bg-white p-5 shadow-[var(--shadow-card-light)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-semibold text-mahogany">{s.company}</h3>
                <p className="mt-1 font-sans text-sm text-mahogany/70">{s.contact_person} · {s.email}</p>
                <p className="mt-2 font-sans text-xs font-semibold uppercase tracking-wide text-gold-deep">{s.package}</p>
                {s.message ? <p className="mt-3 font-sans text-sm text-mahogany/65">{s.message}</p> : null}
              </div>
              <span className={`rounded-full px-3 py-1 font-sans text-xs font-bold uppercase ${
                s.status === "approved" ? "bg-green-100 text-green-800" :
                s.status === "rejected" ? "bg-red-100 text-red-800" :
                "bg-amber-100 text-amber-800"
              }`}>
                {s.status}
              </span>
            </div>
            {s.status === "pending" ? (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleStatus(s.id, "approved")}
                  className="rounded-full bg-espresso px-4 py-2 font-sans text-xs font-semibold text-cream"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleStatus(s.id, "rejected")}
                  className="rounded-full border border-red-200 px-4 py-2 font-sans text-xs font-semibold text-red-700"
                >
                  Reject
                </button>
              </div>
            ) : null}
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="font-sans text-sm text-mahogany/50">No sponsors in this category.</p>
        ) : null}
      </div>
    </div>
  );
}
