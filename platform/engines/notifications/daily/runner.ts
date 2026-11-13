import "server-only";
import { dbQuery, dbExec } from "@/lib/db/query";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { getFeatureFlags } from "@/platform/core/flags";
import { sendNotificationEmail } from "@/platform/engines/notifications/email/resend-client";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import { buildEventReminderEmail } from "@/platform/engines/notifications/email/templates/catalog";
import { resolveSmsSettings } from "@/platform/engines/notifications/sms/settings-store";
import { sendSmsMessage } from "@/platform/engines/notifications/sms/twilio-client";
import { normalizeSmsRecipient } from "@/platform/engines/notifications/sms/format";
import { buildSmsReminder } from "@/platform/engines/notifications/sms/reminders";
import { CAMPAIGN, RELEASE, schedule, recipientKey } from "./policy";
import { buildCommitteeReport, type Counts, type Task } from "./report";

export async function currentCommitteeReport(day = schedule().day) {
    const [counts] = await dbQuery<Counts>(`SELECT COUNT(CASE WHEN status<>N'cancelled' THEN 1 END) AS registrations,COALESCE(SUM(CASE WHEN status<>N'cancelled' THEN number_of_attendees ELSE 0 END),0) AS guests,COUNT(CASE WHEN status=N'confirmed' THEN 1 END) AS confirmed,COUNT(CASE WHEN status<>N'cancelled' AND CONVERT(date,created_at AT TIME ZONE 'AUS Eastern Standard Time')=TRY_CONVERT(date,@day) THEN 1 END) AS newRegistrations,COUNT(CASE WHEN status=N'cancelled' THEN 1 END) AS cancelled FROM rsvps WHERE event_slug=@slug`,{slug:CAMPAIGN,day:day});
    const tasks = await dbQuery<Task>(`SELECT t.title,t.status,t.priority,p.full_name AS owner,CONVERT(varchar(10),t.due_date,23) AS due FROM tasks t LEFT JOIN profiles p ON p.id=t.assigned_to WHERE t.event_slug=@slug AND t.status<>N'completed' ORDER BY t.due_date,t.title`,{slug:CAMPAIGN});
    const deliveries=await deliveryStatus(day);
    const report=buildCommitteeReport(day,counts,tasks,`Today's reminder processing: ${deliveries.map(d=>`${d.kind}: ${d.total} ${d.status}`).join("; ") || "No sends recorded"}. Accepted means provider acceptance, not confirmed inbox/handset delivery.`);
    return report;
}

type Recipient = { id: string; full_name: string; email: string; phone: string | null; email_consent: boolean; sms_consent: boolean; status: string };
export async function deliveryStatus(day = schedule().day) {
  return dbQuery<{kind:string;status:string;total:number}>(`SELECT kind,status,COUNT(*) AS total FROM daily_communications WHERE event_slug=@slug AND send_day=@day GROUP BY kind,status`, {slug:CAMPAIGN,day});
}
export async function claim(day: string, kind: string, recipient: string) {
  const key = recipientKey(recipient);
  const rows = await dbQuery<{claimed:number}>(`SET XACT_ABORT ON; BEGIN TRANSACTION;
    IF NOT EXISTS (SELECT 1 FROM daily_communications WITH (UPDLOCK,HOLDLOCK) WHERE event_slug=@slug AND send_day=@day AND kind=@kind AND recipient_key=@key)
    BEGIN INSERT INTO daily_communications(event_slug,send_day,kind,recipient_key,status) VALUES(@slug,@day,@kind,@key,N'claimed'); SELECT 1 AS claimed; END
    ELSE SELECT 0 AS claimed;
    COMMIT TRANSACTION;`,{slug:CAMPAIGN,day,kind,key});
  return rows[0]?.claimed === 1;
}
export async function finish(day:string, kind:string, recipient:string, status:string, providerId?:string) {
  await dbExec(`UPDATE daily_communications SET status=@status,provider_id=@providerId,updated_at=SYSDATETIMEOFFSET() WHERE event_slug=@slug AND send_day=@day AND kind=@kind AND recipient_key=@key`,{slug:CAMPAIGN,day,kind,key:recipientKey(recipient),status,providerId:providerId ?? null});
}
export async function runDailyCommunications(now = new Date(), dryRun = false) {
  const clock = schedule(now), event = getActiveEventConfig();
  const result = {release:RELEASE,...clock,dryRun,accepted:0,failed:0,skipped:0,eligibleEmail:0,eligibleSms:0,committeeRecipients:0,disabled:false};
  if (event.slug !== CAMPAIGN || process.env.DAILY_COMMUNICATIONS_ENABLED === "false") return {...result,disabled:true};
  const emailReady = getEmailEnvPresence().ready;
  const sms = await resolveSmsSettings();
  const emailEnabled = getFeatureFlags().emailConfirmationsEnabled;
  async function deliver(kind:string, recipient:string, send:()=>Promise<{ok:boolean;id?:string;sid?:string}>) {
    if(dryRun) return;
    if(!await claim(clock.day,kind,recipient)) {result.skipped++;return;}
    // Never auto-retry an ambiguous provider response: claimed/failed require review.
    try {
      const sent = await send();
      await finish(clock.day,kind,recipient,sent.ok ? "accepted" : "failed",sent.id ?? sent.sid);
      if(sent.ok) result.accepted++; else result.failed++;
    } catch {
      result.failed++;
      await finish(clock.day,kind,recipient,"unknown").catch(()=>{});
      console.error("[daily-communications] Delivery outcome requires review",kind);
    }
  }
  if(clock.attendeeDue || dryRun) {
    const recipients = await dbQuery<Recipient>(`SELECT id,full_name,email,phone,email_consent,sms_consent,status FROM rsvps WHERE event_slug=@slug AND status<>N'cancelled' ORDER BY created_at`,{slug:CAMPAIGN});
    const email = buildEventReminderEmail(event);
    const emails = new Set<string>(), phones = new Set<string>();
    for(const original of recipients) {
      // Recheck opt-out/cancellation immediately before considering a send.
      const [r] = await dbQuery<Recipient>(`SELECT id,full_name,email,phone,email_consent,sms_consent,status FROM rsvps WHERE id=@id AND event_slug=@slug AND status<>N'cancelled'`,{id:original.id,slug:CAMPAIGN});
      if(!r) continue;
      const address = r.email.trim().toLowerCase();
      if(r.email_consent && address && !emails.has(address)) {
        emails.add(address); result.eligibleEmail++;
        if(emailReady && emailEnabled) await deliver("attendee-email",address,()=>sendNotificationEmail(address,email));
      }
      const phone = normalizeSmsRecipient(r.phone,sms.defaultCountryCode);
      if(r.sms_consent && phone && !phones.has(phone)) {
        phones.add(phone);result.eligibleSms++;
        if(sms.enabled && sms.remindersEnabled && sms.ready) await deliver("attendee-sms",phone,()=>sendSmsMessage({to:phone,body:buildSmsReminder(event,r.full_name,sms.reminderTemplate),eventSlug:CAMPAIGN}));
      }
    }
  }
  if(clock.committeeDue || dryRun) {
    const recipients = await dbQuery<{email:string}>(`SELECT DISTINCT LOWER(LTRIM(RTRIM(email))) AS email FROM profiles WHERE is_active=1 AND role IN (N'COMMITTEE',N'ADMIN',N'SUPER_ADMIN') AND email<>N'admin@promaxevent.com'`,{});
    const copies=await dbQuery<{email:string}>(`SELECT email FROM committee_report_copies WHERE event_slug=@slug`,{slug:CAMPAIGN});
    for(const copy of copies) if(!recipients.some(r=>r.email===copy.email)) recipients.push(copy);
    result.committeeRecipients=recipients.length;
    const report=await currentCommitteeReport(clock.day);
    for(const r of recipients) if(emailReady) await deliver("committee-email",r.email,()=>sendNotificationEmail(r.email,report));
  }
  return {...result,emailReady,emailEnabled,smsReady:sms.ready,smsEnabled:sms.enabled && sms.remindersEnabled};
}
let timer: ReturnType<typeof setInterval> | undefined;
let busy=false;
export function startDailyCommunications() {
  if(timer || process.env.NODE_ENV !== "production") return;
  const tick=async()=>{if(busy)return;busy=true;try{await runDailyCommunications();}catch{console.error("[daily-communications] Scheduled run failed; inspect portal status");}finally{busy=false;}};
  timer=setInterval(()=>void tick(),60_000);timer.unref();
  // Give IIS time to finish startup; schedule remains durable across restarts.
  const initial=setTimeout(()=>void tick(),15_000);initial.unref();
}
