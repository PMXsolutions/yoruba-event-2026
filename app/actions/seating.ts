"use server";
import {requireAuth} from "@/lib/auth/rbac";
import {getActiveEventConfig} from "@/platform/core/config/active-event";
import {fetchDashboardRsvps} from "@/platform/engines/dashboard/rsvp/queries";
import approved from "@/platform/engines/seating/approved.json";
import {tableLabel,seatingSms,seatingEmail} from "@/platform/engines/seating/messages";
import {campaign,deliveries,claim,complete,ensureSeatingStore} from "@/platform/engines/seating/store";
import {dbExec, dbQuery} from "@/lib/db/query";
import {sendNotificationEmail} from "@/platform/engines/notifications/email/resend-client";
import {getEmailEnvPresence} from "@/platform/engines/notifications/email/env-status";
import {sendSmsMessage} from "@/platform/engines/notifications/sms/twilio-client";
import {resolveSmsSettings} from "@/platform/engines/notifications/sms/settings-store";
import {normalizeSmsRecipient} from "@/platform/engines/notifications/sms/format";
import {revalidatePath} from "next/cache";

export async function seatingReport() {
 const auth=await requireAuth("rsvp.read"); if(!auth.ok) throw new Error(auth.message);
 const fetched=await fetchDashboardRsvps(); if(!fetched.ok) throw new Error(fetched.message);
 const slug=getActiveEventConfig().slug;
 const sent=await deliveries(slug);
 const assigned=await dbQuery<{rsvp_id:string}>(`SELECT rsvp_id FROM dbo.seating_assignments WHERE event_slug=@slug AND campaign=@campaign`,{slug,campaign});
 return fetched.records.map(r=>{
  const a=approved.find(a=>a.ref===r.registrationReference);
  const valid=a && a.size===r.numberOfAttendees && a.name.trim().replace(/\s+/g," ").toLowerCase()===r.fullName.trim().replace(/\s+/g," ").toLowerCase() && r.status!=="cancelled";
  const channel=(ch:string)=>sent.find(d=>d.rsvp_id.toLowerCase()===r.id.toLowerCase()&&d.channel===ch);
  return {id:r.id,name:r.fullName,guests:r.numberOfAttendees,tables:a?tableLabel(a):"Unassigned",valid:!!valid,assigned:assigned.some(x=>x.rsvp_id.toLowerCase()===r.id.toLowerCase()),
   email:channel("email")?.status??(!r.emailConsent?"no consent":!r.email?"missing address":"waiting"),
   sms:channel("sms")?.status??(!r.smsConsent?"no consent":!r.phone?"missing number":"waiting"),
   emailDetail:channel("email")?.detail,smsDetail:channel("sms")?.detail,
   contacted:r.contactedAt,hold:valid?null:"Booking not in approved plan, changed count/name, or cancelled"};
 });
}
export async function sendSeatingBooking(id:string) {
 const auth=await requireAuth("rsvp.write"); if(!auth.ok) throw new Error(auth.message);
 const fetched=await fetchDashboardRsvps();if(!fetched.ok) throw new Error(fetched.message);
 const r=fetched.records.find(x=>x.id===id); if(!r) throw new Error("Booking not found");
 const a=approved.find(x=>x.ref===r.registrationReference);
 if(!a||a.size!==r.numberOfAttendees||a.name.trim().replace(/\s+/g," ").toLowerCase()!==r.fullName.trim().replace(/\s+/g," ").toLowerCase()||r.status==='cancelled') throw new Error("Booking needs seating review; nothing sent");
 const slug=getActiveEventConfig().slug; await ensureSeatingStore();
 await dbExec(`IF NOT EXISTS(SELECT 1 FROM dbo.seating_assignments WHERE event_slug=@slug AND rsvp_id=@id AND campaign=@campaign) INSERT dbo.seating_assignments(event_slug,rsvp_id,campaign,reference,guest_count,tables_json) VALUES(@slug,@id,@campaign,@ref,@count,@tables)`,{slug,id,campaign,ref:a.ref,count:a.size,tables:JSON.stringify(a.allocations)});
 const note=`[Seating 21 Nov] ${a.size} guests; Table${a.allocations.length>1?'s':''} ${tableLabel(a)}.`;
 await dbExec(`UPDATE rsvps SET committee_notes=CONCAT(COALESCE(committee_notes,''),CHAR(10),@note),updated_at=SYSDATETIMEOFFSET() WHERE id=@id AND event_slug=@slug AND CHARINDEX(@note,COALESCE(committee_notes,''))=0 AND LEN(COALESCE(committee_notes,''))+LEN(@note)<3999`,{slug,id,note});
 const issues:string[]=[];
 const email=seatingEmail(a);
 if(r.emailConsent&&r.email) {
  if(!getEmailEnvPresence().ready) issues.push("Email not configured");
  else if(await claim(slug,id,"email",r.email,email.text)) {
   const result=await sendNotificationEmail(r.email,email);
   await complete(slug,id,"email",result.ok,result.ok?result.id??null:null,result.ok?null:result.message);
  }
 }
 if(r.smsConsent&&r.phone) {
  const settings=await resolveSmsSettings();
  if(!settings.enabled||!settings.ready) issues.push("SMS disabled or not configured");
  else if(!normalizeSmsRecipient(r.phone,settings.defaultCountryCode)) issues.push("Invalid phone number");
  else if(await claim(slug,id,"sms",r.phone,seatingSms(a))) {
   const result=await sendSmsMessage({to:r.phone,body:seatingSms(a),eventSlug:slug});
   await complete(slug,id,"sms",result.ok,result.ok?result.sid??null:null,result.ok?null:result.message);
  }
 }
 // Both requested channels must be accepted before contacted is recorded. Keep existing confirmation status.
 await dbExec(`UPDATE rsvps SET contacted_at=COALESCE(contacted_at,SYSDATETIMEOFFSET()),status=CASE WHEN status='new' THEN 'contacted' ELSE status END,updated_at=SYSDATETIMEOFFSET() WHERE id=@id AND event_slug=@slug AND status<>'cancelled' AND (SELECT COUNT(*) FROM dbo.seating_deliveries WHERE event_slug=@slug AND rsvp_id=@id AND campaign=@campaign AND status='sent')=2`,{slug,id,campaign});
 revalidatePath('/dashboard/rsvps');revalidatePath('/dashboard');
 return {issues};
}
