"use client";

import { useMemo, useState, useTransition } from "react";
import { lookupSeatAction } from "@/app/actions/seat-lookup";
import type { SeatLookupResult } from "@/platform/engines/seating/types";
import { SITE } from "@/lib/site";

export function SeatLookupClient({ initialToken }: { initialToken?: string }) {
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [token, setToken] = useState(initialToken ?? "");
  const [result, setResult] = useState<SeatLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const heading = useMemo(() => SITE.name, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await lookupSeatAction({
        name: name || undefined,
        reference: reference || undefined,
        qrToken: token || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res.result);
    });
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-[1.75rem] border border-gold/20 bg-mahogany/70 p-8 text-cream shadow-xl backdrop-blur">
      <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-gold-bright">
        Find my seat
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold">{heading}</h1>
      <p className="mt-2 font-sans text-sm text-cream/70">
        Enter your full name or registration reference. We never show the full guest list.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl border border-white/10 bg-espresso/80 px-4 py-3 text-sm outline-none focus:border-gold-bright/50"
        />
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Registration reference"
          className="w-full rounded-xl border border-white/10 bg-espresso/80 px-4 py-3 text-sm outline-none focus:border-gold-bright/50"
        />
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="QR token (from scan)"
          className="w-full rounded-xl border border-white/10 bg-espresso/80 px-4 py-3 text-sm outline-none focus:border-gold-bright/50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-gold px-5 py-3 font-sans text-sm font-bold uppercase tracking-wide text-espresso disabled:opacity-60"
        >
          {isPending ? "Looking up…" : "Show my seat"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="mt-6 rounded-2xl border border-gold/20 bg-espresso/60 p-5">
          <p className="font-display text-2xl text-cream">{result.guestName}</p>
          <dl className="mt-4 space-y-2 font-sans text-sm text-cream/80">
            <div className="flex justify-between gap-3"><dt className="text-gold-muted">Zone</dt><dd>{result.zone ?? "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gold-muted">Table</dt><dd>{result.tableName ?? "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gold-muted">Seat</dt><dd>{result.seatLabel ?? "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gold-muted">Ticket</dt><dd>{result.ticketType ?? "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gold-muted">Status</dt><dd>{result.checkedIn ? "Checked in" : "Not checked in"}</dd></div>
          </dl>
          {result.floorPlanUrl ? (
            <a
              href={result.floorPlanUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block font-sans text-sm text-gold-light underline"
            >
              View floor plan
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
