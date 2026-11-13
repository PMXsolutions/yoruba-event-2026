import { z } from "zod";
import { getAuthUser } from "@/lib/auth/rbac";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { claim, finish, currentCommitteeReport } from "@/platform/engines/notifications/daily/runner";
import { schedule } from "@/platform/engines/notifications/daily/policy";
import { buildCommitteeReport } from "@/platform/engines/notifications/daily/report";
import { buildEventReminderEmail } from "@/platform/engines/notifications/email/templates/catalog";
import { sendNotificationEmail } from "@/platform/engines/notifications/email/resend-client";
import { resolveSmsSettings } from "@/platform/engines/notifications/sms/settings-store";
import { normalizeSmsRecipient } from "@/platform/engines/notifications/sms/format";
import { sendSmsMessage } from "@/platform/engines/notifications/sms/twilio-client";
import { buildSmsReminder } from "@/platform/engines/notifications/sms/reminders";
export const runtime="nodejs";
export async function POST(request:Request) {
 const user=await getAuthUser();
 if(user?.role!=="SUPER_ADMIN" || !["https://yorubaassociationact.org","https://yorubadaycanberra.com"].includes(request.headers.get("origin")||"")) return Response.json({error:"Forbidden"},{status:403});
 const parsed=z.object({email:z.union([z.email(),z.literal("")]),phone:z.string().max(40),mode:z.enum(["sample","report"]).optional()}).safeParse(await request.json().catch(()=>null));
 if(!parsed.success) return Response.json({error:"Enter a valid test email/phone"},{status:400});
 const event=getActiveEventConfig(),day=schedule().day,results:Record<string,string>={};
 const send=async(kind:string,to:string,fn:()=>Promise<{ok:boolean;id?:string;sid?:string}>)=>{
  if(!await claim(day,kind,to)){results[kind]="Already attempted today";return;}
  try{const r=await fn();await finish(day,kind,to,r.ok?"accepted":"failed",r.id??r.sid);results[kind]=r.ok?"Provider accepted":"Provider failed";}catch{await finish(day,kind,to,"unknown");results[kind]="Unknown; inspect provider before retrying";}
 };
 if(parsed.data.mode==="report") {
  if(!parsed.data.email) return Response.json({error:"Test email required"},{status:400});
  const to=parsed.data.email.trim().toLowerCase();
  const report=await currentCommitteeReport(day); report.subject="TEST — Current figures — "+report.subject;
  await send("test-report-live",to,()=>sendNotificationEmail(to,report));
  return Response.json(results);
 }
 if(parsed.data.email){
  const to=parsed.data.email.trim().toLowerCase();
  const attendee=buildEventReminderEmail(event);attendee.subject="TEST — "+attendee.subject;
  await send("test-attendee",to,()=>sendNotificationEmail(to,attendee));
  const report=buildCommitteeReport(day,{registrations:0,guests:0,confirmed:0,newRegistrations:0,cancelled:0},[],"TEST SAMPLE ONLY — these are not live counts.");report.subject="TEST SAMPLE — "+report.subject;
  await send("test-committee",to,()=>sendNotificationEmail(to,report));
 }
 if(parsed.data.phone){const settings=await resolveSmsSettings();const phone=normalizeSmsRecipient(parsed.data.phone,settings.defaultCountryCode);if(!phone)return Response.json({error:"Invalid test phone",results},{status:400});await send("test-sms",phone,()=>sendSmsMessage({to:phone,body:"TEST: "+buildSmsReminder(event,"Joshua",settings.reminderTemplate),eventSlug:event.slug}));}
 return Response.json(results);
}
