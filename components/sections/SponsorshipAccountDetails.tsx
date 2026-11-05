"use client";

import { useState } from "react";
import type { PublicSponsorshipAccount } from "@/platform/engines/sponsors/account";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border border-mahogany/15 px-3 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-[0.16em] text-mahogany/70 transition-colors hover:border-gold/40 hover:text-mahogany"
    >
      {copied ? "Copied" : `Copy ${label}`}
    </button>
  );
}

/** Bank details a sponsor or donor uses to pay the association. */
export function SponsorshipAccountDetails({
  account,
  compact = false,
}: {
  account: PublicSponsorshipAccount;
  compact?: boolean;
}) {
  const rows = [
    { label: "BSB", display: account.bsbDisplay, copy: account.bsbDigits },
    { label: "Account number", display: account.accountNumber, copy: account.accountNumber },
    { label: "Account name", display: account.accountName, copy: account.accountName },
  ];

  return (
    <div className={compact ? "" : "mx-auto mt-10 max-w-3xl"}>
      {compact ? null : (
        <>
          <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.22em] text-gold-deep">
            Sponsorship and donations
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-mahogany">Pay by bank transfer</h3>
        </>
      )}
      <p className={`${compact ? "" : "mt-3"} font-sans text-sm leading-relaxed text-mahogany/70`}>
        {account.instructions ??
          "Transfer sponsorship payments and donations to the association account below."}
      </p>
      <dl className="mt-5 divide-y divide-mahogany/10 overflow-hidden rounded-2xl border border-mahogany/10 bg-cream/80">
        {account.bankName ? (
          <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <dt className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.18em] text-mahogany/45">
              Bank
            </dt>
            <dd className="font-sans text-base font-medium text-mahogany">{account.bankName}</dd>
          </div>
        ) : null}
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <dt className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.18em] text-mahogany/45">
                {row.label}
              </dt>
              <dd className="mt-1 font-sans text-lg font-semibold tracking-wide text-mahogany">{row.display}</dd>
            </div>
            <CopyButton value={row.copy} label={row.label} />
          </div>
        ))}
      </dl>
    </div>
  );
}
