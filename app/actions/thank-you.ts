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
export async function sendThankYou(id:string,only:"both"|"email"|"sms"="both"){
 const r=(await records()).find(r=>r.id===id);if(!r||r.status==='cancelled')throw new Error('Booking unavailable');
 const event=getActiveEventConfig(),settings=await resolveSmsSettings();
 const address=r.email.trim().toLowerCase(),phone=normalizeSmsRecipient(r.phone,settings.defaultCountryCode);
 async function deliver(kind:string,to:string,send:()=>Promise<{ok:boolean;id?:string;sid?:string}>){
  if(!await claim(day,kind,to))return;
  try{const result=await send();await finish(day,kind,to,result.ok?'sent':'review_required',result.id??result.sid);if(!result.ok)throw new Error("Provider rejected a message; paused for review");}catch{await finish(day,kind,to,'review_required');throw new Error('Delivery needs review; it will not be retried automatically');}
 }
 if(only!=="sms"&&r.emailConsent&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)){if(!getEmailEnvPresence().ready)throw new Error('Email not configured');await deliver('thanks-email',address,()=>sendNotificationEmail(address,thankYouEmail(r.fullName,event)));}
 if(only!=="email"&&r.smsConsent&&phone){if(!settings.enabled||!settings.ready)throw new Error('SMS unavailable');await deliver('thanks-sms',phone,()=>sendSmsMessage({to:phone,body:sms,eventSlug:event.slug}));}
}

// Manual alternate transport: reserve first, then record the Gmail provider IDs.
// Existing SMTP rejections were reviewed (421 server busy); unknown claims stay held.
export async function prepareGmailFallback(){
 const rs=await records(),event=getActiveEventConfig();const out:{email:string;name:string;key:string;html:string;subject:string}[]=[];const seen=new Set<string>();
 for(const r of rs){const email=r.email.trim().toLowerCase();if(r.status==='cancelled'||!r.emailConsent||!/^\S+@\S+\.\S+$/.test(email)||seen.has(email))continue;seen.add(email);const key=recipientKey(email);
 const [prior]=await dbQuery<{status:string}>(`SELECT status FROM daily_communications WHERE event_slug=@slug AND send_day=@day AND kind='thanks-email' AND recipient_key=@key`,{slug:event.slug,day,key});
 if(prior&&!['review_required','external_pending'].includes(prior.status))continue;
 if(!prior&&!await claim(day,'thanks-email',email))continue;
 await finish(day,'thanks-email',email,'external_pending');
 const m=thankYouEmail(r.fullName,event);out.push({email,name:r.fullName,key,html:m.html,subject:m.subject});
 }return out;
}
export async function recordGmailResults(raw:string){
 await records();const results=JSON.parse(raw) as {email:string;messageId:string}[];if(!Array.isArray(results)||results.length>100)throw new Error('Invalid results');
 let saved=0;for(const r of results){if(!/^[a-f0-9]{12,32}$/.test(r.messageId)||typeof r.email!=='string')throw new Error('Invalid receipt');const key=recipientKey(r.email);const [row]=await dbQuery<{status:string}>(`SELECT status FROM daily_communications WHERE event_slug=@slug AND send_day=@day AND kind='thanks-email' AND recipient_key=@key`,{slug:getActiveEventConfig().slug,day,key});if(row?.status==='sent')continue;if(row?.status!=='external_pending')throw new Error('Recipient was not reserved');await finish(day,'thanks-email',r.email,'sent','gmail:'+r.messageId);saved++;}return saved;
}
