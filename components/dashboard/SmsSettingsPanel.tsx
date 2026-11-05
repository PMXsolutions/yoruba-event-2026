"use client";

import { useState, useTransition } from "react";
import { saveSmsSettingsAction, sendTestSmsAction } from "@/app/actions/sms-settings";
import { ToolbarButton } from "@/components/dashboard/dashboard-ui";
import {
  renderSmsTemplate,
  type PublicSmsSettings,
  type SmsTemplateValues,
} from "@/platform/engines/notifications/sms/format";

const field =
  "mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10";
const label = "block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45";

export function SmsSettingsPanel({
  settings,
  canWrite,
  preview,
}: {
  settings: PublicSmsSettings;
  canWrite: boolean;
  preview: SmsTemplateValues;
}) {
  const [provider, setProvider] = useState(settings.provider);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [remindersEnabled, setRemindersEnabled] = useState(settings.remindersEnabled);
  const [username, setUsername] = useState(canWrite ? settings.username : "");
  const [password, setPassword] = useState("");
  const [senderId, setSenderId] = useState(settings.senderId);
  const [secureTransport, setSecureTransport] = useState(settings.secureTransport);
  const [messageType, setMessageType] = useState(settings.messageType);
  const [countryCode, setCountryCode] = useState(settings.defaultCountryCode);
  const [template, setTemplate] = useState(settings.reminderTemplate);
  const [testPhone, setTestPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const rendered = renderSmsTemplate(template, preview);

  function save() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await saveSmsSettingsAction({
        provider,
        enabled,
        remindersEnabled,
        username,
        password,
        senderId,
        secureTransport,
        messageType,
        defaultCountryCode: countryCode,
        reminderTemplate: template,
      });
      if (!result.ok) setError(result.error);
      else {
        setPassword("");
        setNotice("SMS settings saved.");
      }
    });
  }

  function sendTest() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await sendTestSmsAction(testPhone);
      if (!result.ok) setError(result.error);
      else setNotice(result.message);
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-mahogany/[0.06] bg-white shadow-[0_1px_2px_rgba(36,21,15,0.04),0_8px_24px_-8px_rgba(36,21,15,0.08)]">
      <div className="border-b border-mahogany/[0.05] px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg font-semibold text-mahogany">SMS settings</h2>
        <p className="mt-0.5 font-sans text-xs text-mahogany/50">
          DirectSMS reminders and confirmations. Passwords are stored encrypted and are never shown again.
        </p>
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <dl className="grid gap-3 font-sans text-sm sm:grid-cols-3">
          <StatusItem label="Gateway" value={provider === "twilio" ? "Twilio" : "DirectSMS"} />
          <StatusItem label="SMS" value={settings.enabled && settings.ready ? "Ready" : settings.enabled ? "Enabled, incomplete" : "Off"} />
          <StatusItem label="Reminders" value={settings.remindersEnabled ? "On" : "Off"} />
        </dl>

        {!settings.databaseReady ? (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-950">
            The database is not configured, so these settings cannot be saved yet.
          </p>
        ) : null}
        {settings.credentialLocked ? (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-950">
            The saved password could not be read. Enter it again and save.
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

        {canWrite ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Provider
              <select className={field} value={provider} onChange={(e) => setProvider(e.target.value as PublicSmsSettings["provider"])}>
                <option value="directsms">DirectSMS</option>
                <option value="twilio">Twilio</option>
              </select>
            </label>
            <label className={label}>
              Sender ID
              <input className={field} value={senderId} maxLength={11} onChange={(e) => setSenderId(e.target.value)} />
            </label>
            <label className="flex items-center gap-3 font-sans text-sm text-mahogany sm:col-span-2">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Enable SMS confirmations
            </label>
            <label className="flex items-center gap-3 font-sans text-sm text-mahogany sm:col-span-2">
              <input type="checkbox" checked={remindersEnabled} onChange={(e) => setRemindersEnabled(e.target.checked)} />
              Enable event SMS reminders for registrants who opted in
            </label>

            {provider === "directsms" ? (
              <>
                <label className={label}>
                  DirectSMS username
                  <input className={field} value={username} autoComplete="off" onChange={(e) => setUsername(e.target.value)} />
                </label>
                <label className={label}>
                  DirectSMS password
                  <input
                    className={field}
                    type="password"
                    value={password}
                    autoComplete="new-password"
                    placeholder={settings.hasPassword ? "Saved — enter a new password to replace it" : "Required the first time SMS is enabled"}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className={label}>
                  Default country code
                  <input className={field} value={countryCode} inputMode="numeric" maxLength={3} onChange={(e) => setCountryCode(e.target.value)} />
                </label>
                <label className={label}>
                  Message type
                  <select className={field} value={messageType} onChange={(e) => setMessageType(e.target.value as PublicSmsSettings["messageType"])}>
                    <option value="1-way">1-way</option>
                    <option value="2-way">2-way</option>
                  </select>
                </label>
                <label className={`${label} sm:col-span-2`}>
                  Gateway connection
                  <select
                    className={field}
                    value={secureTransport ? "https" : "http"}
                    onChange={(e) => setSecureTransport(e.target.value === "https")}
                  >
                    <option value="https">HTTPS — api.directsms.com.au</option>
                    <option value="http">HTTP — api.directsms.com.au</option>
                  </select>
                </label>
              </>
            ) : (
              <p className="font-sans text-sm text-mahogany/65 sm:col-span-2">
                Twilio uses <span className="font-mono text-xs">TWILIO_ACCOUNT_SID</span>,{" "}
                <span className="font-mono text-xs">TWILIO_AUTH_TOKEN</span>, and{" "}
                <span className="font-mono text-xs">TWILIO_FROM_NUMBER</span>. Those stay in the server environment.
                {settings.twilioReady ? " Twilio credentials are present." : " Twilio credentials are incomplete."}
              </p>
            )}

            <label className={`${label} sm:col-span-2`}>
              Reminder message
              <textarea
                className={`${field} min-h-24 resize-y`}
                value={template}
                maxLength={320}
                onChange={(e) => setTemplate(e.target.value)}
              />
            </label>
            <p className="font-sans text-xs text-mahogany/50 sm:col-span-2">
              Placeholders: {"{firstName}"}, {"{eventName}"}, {"{date}"}, {"{location}"}, {"{website}"}. Numbers starting with 0 are sent with country code {countryCode || "61"}. A leading + is kept as an international number.
            </p>
            <div className="rounded-xl border border-mahogany/[0.06] bg-cream/40 px-4 py-3 sm:col-span-2">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/40">Preview</p>
              <p className="mt-2 font-sans text-sm text-mahogany/80">{rendered || "The reminder is empty."}</p>
            </div>
            <div className="sm:col-span-2">
              <ToolbarButton primary disabled={isPending || !settings.databaseReady} onClick={save}>
                {isPending ? "Saving…" : "Save SMS settings"}
              </ToolbarButton>
            </div>

            <div className="grid gap-3 border-t border-mahogany/[0.06] pt-4 sm:col-span-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className={label}>
                Send a test SMS
                <input
                  className={field}
                  value={testPhone}
                  inputMode="tel"
                  placeholder="04xx xxx xxx"
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </label>
              <ToolbarButton disabled={isPending || testPhone.trim().length < 8} onClick={sendTest}>
                Send test
              </ToolbarButton>
            </div>
            <p className="font-sans text-xs text-mahogany/45 sm:col-span-2">
              The test uses the saved gateway, not unsaved fields. Reminders only go to registrants who ticked SMS consent.
            </p>
          </div>
        ) : (
          <p className="font-sans text-sm text-mahogany/60">
            An administrator can change the gateway, sender ID, and reminder message. The password is not shown here.
          </p>
        )}
      </div>
    </section>
  );
}

function StatusItem({ label: itemLabel, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-mahogany/[0.06] bg-cream/40 px-4 py-3">
      <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/40">{itemLabel}</dt>
      <dd className="mt-1 font-medium text-mahogany">{value}</dd>
    </div>
  );
}
