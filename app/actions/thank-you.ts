'use server';
import {requireAuth} from '@/lib/auth/rbac';
import {fetchDashboardRsvps} from '@/platform/engines/dashboard/rsvp/queries';
import {getActiveEventConfig} from '@/platform/core/config/active-event';
import {claim,finish} from '@/platform/engines/notifications/daily/runner';
import {recipientKey} from '@/platform/engines/notifications/daily/policy';
import {dbQuery} from '@/lib/db/query';
import {sendNotificationEmail} from '@/platform/engines/notifications/email/resend-client';
import {getEmailEnvPresence} from '@/platform/engines/notifications/email/env-status';
import {resolveSmsSettings} from '@/platform/engines/notifications/sms/settings-store';
import {normalizeSmsRecipient} from '@/platform/engines/notifications/sms/format';
import {sendSmsMessage} from '@/platform/engines/notifications/sms/twilio-client';
import {thankYouEmail,sms} from '@/platform/engines/thank-you/messages';
const day='2026-11-25';
async function records(){const a=await requireAuth('rsvp.write');if(!a.ok)throw new Error(a.message);const f=await fetchDashboardRsvps();if(!f.ok)throw new Error(f.message);return f.records;}
export async function thankYouReport(){
 const rs=await records(),settings=await resolveSmsSettings();
 const ds=await dbQuery<{kind:string;recipient_key:string;status:string}>(`SELECT kind,recipient_key,status FROM daily_communications WHERE event_slug=@slug AND send_day=@day AND kind IN ('thanks-email','thanks-sms')`,{slug:getActiveEventConfig().slug,day});
 const seen=new Set<string>();
 return rs.map(r=>{const channel=(kind:string,address:string|null,consent:boolean)=>{if(r.status==='cancelled')return 'cancelled';if(!consent)return 'no consent';if(!address)return 'missing/invalid';const key=recipientKey(address);const prior=ds.find(d=>d.kind===kind&&d.recipient_key===key);if(prior)return prior.status;const dedup=kind+key;if(seen.has(dedup))return 'shared contact';seen.add(dedup);return 'waiting';};return {id:r.id,name:r.fullName,email:channel('thanks-email',/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim())?r.email.trim().toLowerCase():null,r.emailConsent),sms:channel('thanks-sms',normalizeSmsRecipient(r.phone,settings.defaultCountryCode),r.smsConsent)};});
}
export async function thankYouPreview(){await records();return thankYouEmail('Our valued guest',getActiveEventConfig()).html;}
export async function sendThankYou(id:string){
 const r=(await records()).find(r=>r.id===id);if(!r||r.status==='cancelled')throw new Error('Booking unavailable');
 const event=getActiveEventConfig(),settings=await resolveSmsSettings();
 const address=r.email.trim().toLowerCase(),phone=normalizeSmsRecipient(r.phone,settings.defaultCountryCode);
 async function deliver(kind:string,to:string,send:()=>Promise<{ok:boolean;id?:string;sid?:string}>){
  if(!await claim(day,kind,to))return;
  try{const result=await send();await finish(day,kind,to,result.ok?'sent':'review_required',result.id??result.sid);}catch{await finish(day,kind,to,'review_required');throw new Error('Delivery needs review; it will not be retried automatically');}
 }
 if(r.emailConsent&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)){if(!getEmailEnvPresence().ready)throw new Error('Email not configured');await deliver('thanks-email',address,()=>sendNotificationEmail(address,thankYouEmail(r.fullName,event)));}
 if(r.smsConsent&&phone){if(!settings.enabled||!settings.ready)throw new Error('SMS unavailable');await deliver('thanks-sms',phone,()=>sendSmsMessage({to:phone,body:sms,eventSlug:event.slug}));}
}
