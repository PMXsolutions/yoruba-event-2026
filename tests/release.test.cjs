/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness loads CommonJS transpilation. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
// Execute the real TypeScript modules with only external boundaries replaced.
function load(file, mocks = {}, cache = new Map()) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const loaded = { exports: {} }; cache.set(absolute, loaded);
  const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const localRequire = id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === 'server-only') return {};
    if (id.startsWith('@/')) return load(id.slice(2) + '.ts', mocks, cache);
    return require(id);
  };
  new Function('require', 'module', 'exports', code)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
function dispatchHarness({ enabled = true, consent = true, ready = true, result = {ok:true,id:'provider-id'}, persistFailure = false, sendThrows = false } = {}) {
  const writes = [], events = []; let sends = 0;
  const {dispatchRsvpNotifications} = load('platform/engines/notifications/dispatch.ts', {
    '@/platform/core/flags': {getFeatureFlags:()=>({emailConfirmationsEnabled:enabled,smsEnabled:false})},
    '@/lib/activity/log': {logActivity:async x=>events.push(x.action)},
    '@/platform/engines/notifications/delivery': {updateRsvpEmailDelivery:async x=>{writes.push(x.status);if(persistFailure)throw Error('DB unavailable');}, updateRsvpSmsDelivery:async()=>{}},
    '@/platform/engines/notifications/email/env-status': {getEmailEnvPresence:()=>({ready,transport:'smtp'})},
    '@/platform/engines/notifications/email/resend-client': {sendRsvpConfirmationEmail:async()=>{sends++;assert.equal(writes.at(-1),'pending');if(sendThrows)throw Error('provider exception');return result;}},
  });
  return {writes,events,get sends(){return sends;},run:(id='rsvp-id')=>dispatchRsvpNotifications({slug:'test'}, {id,email_consent:consent},{channels:['email']})};
}
for (const [name, opts, status] of [
  ['provider acceptance',{},'sent'],['provider failure',{result:{ok:false,reason:'SEND_FAILED'}},'failed'],
  ['provider exception',{sendThrows:true},'failed'],['disabled flag',{enabled:false},'disabled'],
  ['declined consent',{consent:false},'consent_declined'],['missing configuration',{ready:false},'not_configured'],
]) test(name, async()=>{const h=dispatchHarness(opts);const result=await h.run();assert.equal(result.emailStatus,status);assert.equal(h.writes.at(-1),status);assert.equal(h.sends,['sent','failed'].includes(status)?1:0);assert.ok(h.events.includes(`email.confirmation.${status}`));});
test('tracking failure prevents untracked email',async()=>{const h=dispatchHarness({persistFailure:true});await assert.rejects(h.run());assert.equal(h.sends,0);});
test('missing id fails explicitly',async()=>{const h=dispatchHarness();await assert.rejects(h.run(null));assert.equal(h.sends,0);});
test('status write detects no matching row',async()=>{
 const {updateRsvpEmailDelivery}=load('platform/engines/notifications/delivery.ts',{'@/lib/supabase/admin':{createServiceRoleClient:()=>({from:()=>({update:()=>({eq:()=>({select:()=>({single:async()=>({data:null,error:null})})})})})})}});
 await assert.rejects(updateRsvpEmailDelivery({rsvpId:'missing',status:'sent'}));
});
test('production auth cannot be disabled by flag',()=>{const before={...process.env};try{process.env.NODE_ENV='production';process.env.DASHBOARD_AUTH_REQUIRED='false';assert.equal(load('platform/core/flags.ts').getFeatureFlags().dashboardAuthRequired,true);}finally{process.env=before;}});
test('consent validation rejects unknown strings and SMS without phone',()=>{
 const {createRsvpFormSchema}=load('platform/engines/rsvp/schema.ts');const schema=createRsvpFormSchema(['General']);
 const form={fullName:'Test Person',email:'test@example.invalid',attendees:1,ticketType:'General'};
 assert.equal(schema.safeParse({...form,smsConsent:'garbage'}).success,false);
 assert.equal(schema.safeParse({...form,smsConsent:true}).success,false);
 assert.equal(schema.parse({...form,emailConsent:false}).emailConsent,false);
});
test('insert writes a stable UUID and pending atomically, without returned id',async()=>{
 let inserted;
 const client={from:()=>({select:()=>({eq(){return this},gte(){return this},limit(){return this},maybeSingle:async()=>({data:null,error:null})}),insert:async row=>{inserted=row;return {error:null};}})};
 const {submitRsvpToDatabase}=load('platform/engines/rsvp/submit.ts',{
  '@/lib/supabase/admin':{createServiceRoleClient:()=>client},
  '@/lib/supabase/env-status':{getSupabaseEnvPresence:()=>({serviceRoleReady:true})},
  '@/platform/core/flags':{getFeatureFlags:()=>({publicRegistrationOpen:true})},
 });
 const result=await submitRsvpToDatabase({fullName:'Test',email:'test@example.invalid',attendees:1,ticketType:'General'},{slug:'test',ticketTypes:['General']});
 assert.equal(result.ok,true);assert.equal(result.record.id,inserted.id);assert.match(inserted.id,/^[0-9a-f-]{36}$/);assert.equal(inserted.email_status,'pending');
});
test('inactive profile and missing permission fail closed',async()=>{
 const rbac=load('lib/auth/rbac.ts',{'@/lib/supabase/server':{createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'test',email:'test@example.invalid'}}})}})},'@/lib/supabase/admin':{createServiceRoleClient:()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{is_active:false},error:null})})})})})}});
 assert.equal(await rbac.getAuthUser(),null);await assert.rejects(rbac.assertPermission('rsvp.read'));
});
test('missing migration rejects registration without legacy insert retry',async()=>{
 let inserts=0;
 const client={from:()=>({select:()=>({eq(){return this},gte(){return this},limit(){return this},maybeSingle:async()=>({data:null,error:null})}),insert:async()=>{inserts++;return {error:{message:'email_status missing from schema cache',code:'PGRST204'}};}})};
 const {submitRsvpToDatabase}=load('platform/engines/rsvp/submit.ts',{'@/lib/supabase/admin':{createServiceRoleClient:()=>client},'@/lib/supabase/env-status':{getSupabaseEnvPresence:()=>({serviceRoleReady:true})},'@/platform/core/flags':{getFeatureFlags:()=>({publicRegistrationOpen:true})}});
 const result=await submitRsvpToDatabase({fullName:'Test',email:'test@example.invalid',attendees:1,ticketType:'General'},{slug:'test',ticketTypes:['General']});assert.equal(result.ok,false);assert.equal(inserts,1);
});
test('public action preserves saved RSVP after notification persistence failure',async()=>{
 const {submitRsvp}=load('app/actions/rsvp.ts',{
 'next/headers':{headers:async()=>new Headers()},
 '@/platform/core/config/active-event':{getActiveEventConfig:()=>({slug:'test'})},
 '@/platform/core/flags':{getFeatureFlags:()=>({publicRegistrationOpen:true})},
 '@/platform/engines/rsvp/submit':{submitRsvpToDatabase:async()=>({ok:true,record:{id:'stable-id',registration_reference:'TEST-REF'}})},
 '@/platform/engines/notifications/dispatch':{dispatchRsvpNotifications:async()=>{throw Error('Tracking failed');}},
 '@/lib/activity/log':{logActivity:async()=>{}},
 });
 const result=await submitRsvp({});assert.equal(result.ok,true);assert.equal(result.registrationReference,'TEST-REF');assert.equal(result.emailSent,false);
});
