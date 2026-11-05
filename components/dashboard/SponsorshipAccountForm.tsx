"use client";

import { useState, useTransition } from "react";
import { saveSponsorshipAccountAction } from "@/app/actions/dashboard";
import { ToolbarButton } from "@/components/dashboard/dashboard-ui";
import {
  DEFAULT_SPONSORSHIP_INSTRUCTIONS,
  formatBsb,
  type SponsorshipAccount,
} from "@/platform/engines/sponsors/account";

const field =
  "mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10";
const label = "block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45";

export function SponsorshipAccountForm({
  account,
  unavailable,
}: {
  account: SponsorshipAccount | null;
  unavailable?: string | null;
}) {
  const [accountName, setAccountName] = useState(account?.accountName ?? "");
  const [bsb, setBsb] = useState(account ? formatBsb(account.bsb) : "");
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber ?? "");
  const [bankName, setBankName] = useState(account?.bankName ?? "");
  const [instructions, setInstructions] = useState(
    account?.instructions ?? DEFAULT_SPONSORSHIP_INSTRUCTIONS,
  );
  const [visible, setVisible] = useState(account?.visible ?? true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await saveSponsorshipAccountAction({
        accountName,
        bsb,
        accountNumber,
        bankName,
        instructions,
        visible,
      });
      if (!result.ok) setError(result.error);
      else setNotice(account ? "Receiving account updated." : "Receiving account saved.");
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-mahogany/[0.06] bg-white shadow-[0_1px_2px_rgba(36,21,15,0.04),0_8px_24px_-8px_rgba(36,21,15,0.08)]">
      <div className="border-b border-mahogany/[0.05] px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg font-semibold text-mahogany">Receiving account</h2>
        <p className="mt-0.5 font-sans text-xs text-mahogany/50">
          Bank details shown on the public sponsorship page for sponsorship payments and donations.
        </p>
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-6">
        {unavailable ? (
          <p role="alert" className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-950">
            {unavailable}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 font-sans text-sm text-red-900">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 font-sans text-sm text-emerald-950">
            {notice}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${label} sm:col-span-2`}>
            Account name
            <input className={field} value={accountName} maxLength={200} onChange={(e) => setAccountName(e.target.value)} />
          </label>
          <label className={label}>
            BSB
            <input className={field} value={bsb} inputMode="numeric" placeholder="062-904" onChange={(e) => setBsb(e.target.value)} />
          </label>
          <label className={label}>
            Account number
            <input className={field} value={accountNumber} inputMode="numeric" onChange={(e) => setAccountNumber(e.target.value)} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Bank name
            <input
              className={field}
              value={bankName}
              maxLength={120}
              placeholder="Optional"
              onChange={(e) => setBankName(e.target.value)}
            />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Instructions for sponsors and donors
            <textarea
              className={`${field} min-h-24 resize-y`}
              value={instructions}
              maxLength={500}
              rows={3}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-3 font-sans text-sm text-mahogany sm:col-span-2">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Show these details on the public sponsorship page
          </label>
        </div>
        <ToolbarButton primary disabled={isPending || Boolean(unavailable)} onClick={save}>
          {isPending ? "Saving…" : account ? "Save account details" : "Add account details"}
        </ToolbarButton>
      </div>
    </section>
  );
}
