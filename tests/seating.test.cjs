const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');
function load(file,mocks){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(n=>{if(n in mocks)return mocks[n];throw Error(n)},m,m.exports);return m.exports;}
const plan=require('../platform/engines/seating/approved.json');const messages=load('platform/engines/seating/messages.ts',{});
test('approved parties fit tables, reserved tables remain empty, Kadiri and Olusesi intact; all SMS fit limit',()=>{
 const counts={};const refs=new Set();for(const a of plan){assert(!refs.has(a.ref));refs.add(a.ref);assert.equal(a.allocations.reduce((n,x)=>n+x.guests,0),a.size);for(const x of a.allocations){assert(x.table>3&&x.table<=34);counts[x.table]=(counts[x.table]||0)+x.guests;}assert(messages.seatingSms(a).length<=480);if(a.size<=8)assert.equal(a.allocations.length,1);}
 assert(Object.values(counts).every(n=>n<=8));assert.equal(plan.find(a=>a.name.includes('Kadiri')).allocations[0].table,34);assert.equal(plan.find(a=>a.name==='Rotimi Olusesi').size,6);
});
function harness({consent=true,count,failed=false,allowed=true}={}){
 const a=plan[0],sent=new Map(),calls=[];const r={id:'test',fullName:a.name,registrationReference:a.ref,numberOfAttendees:count??a.size,status:'new',emailConsent:consent,smsConsent:consent,email:'test@example.org',phone:'0412345678'};
 const mocks={
 '@/lib/auth/rbac':{requireAuth:async()=>({ok:allowed,message:'denied'})},'@/platform/core/config/active-event':{getActiveEventConfig:()=>({slug:'event'})},
 '@/platform/engines/dashboard/rsvp/queries':{fetchDashboardRsvps:async()=>({ok:true,records:[r]})},'@/platform/engines/seating/approved.json':plan,'@/platform/engines/seating/messages':messages,'@/platform/engines/seating/branded-email':{brandedSeatingEmail:messages.seatingEmail},
 '@/platform/engines/seating/store':{campaign:'test',ensureSeatingStore:async()=>{},claim:async(s,id,ch)=>{if(sent.has(ch))return false;sent.set(ch,'sending');return true},complete:async(s,id,ch,ok)=>sent.set(ch,ok?'sent':'review_required')},
 '@/lib/db/query':{dbExec:async(sql)=>calls.push(sql)},'@/platform/engines/notifications/email/resend-client':{sendNotificationEmail:async()=>{calls.push('EMAIL');return {ok:true,id:'e'}}},
 '@/platform/engines/notifications/email/env-status':{getEmailEnvPresence:()=>({ready:true})},'@/platform/engines/notifications/sms/twilio-client':{sendSmsMessage:async()=>{calls.push('SMS');return {ok:!failed,sid:'s',message:'uncertain'}}},
 '@/platform/engines/notifications/sms/settings-store':{resolveSmsSettings:async()=>({ready:true,enabled:true})},'@/platform/engines/notifications/sms/format':{normalizeSmsRecipient:()=>true},'next/cache':{revalidatePath:()=>{}}};
 return {...load('app/actions/seating.ts',mocks),sent,calls};
}
test('repeat run never repeats accepted or uncertain sends; contacted update requires both sent',async()=>{const h=harness({failed:true});await h.sendSeatingBooking('test');await h.sendSeatingBooking('test');assert.equal(h.calls.filter(x=>x==='EMAIL').length,1);assert.equal(h.calls.filter(x=>x==='SMS').length,1);assert.equal(h.sent.get('sms'),'review_required');assert(h.calls.some(x=>/contacted_at/.test(x)&&/channel='sms' AND status='sent'/.test(x)));});
test('changed counts and unauthorized users cannot send; opt-outs skipped',async()=>{for(const config of [{count:999},{allowed:false}]){const h=harness(config);await assert.rejects(()=>h.sendSeatingBooking('test'));assert.equal(h.calls.length,0);}const h=harness({consent:false});await h.sendSeatingBooking('test');assert.equal(h.sent.size,0);});

test("branded replacement is sent once without repeating SMS",async()=>{const h=harness();await h.sendSeatingBooking("test");await h.sendSeatingBooking("test",true);await h.sendSeatingBooking("test",true);assert.equal(h.calls.filter(x=>x==="EMAIL").length,2);assert.equal(h.calls.filter(x=>x==="SMS").length,1);assert.equal(h.sent.get("email-v2"),"sent");});
