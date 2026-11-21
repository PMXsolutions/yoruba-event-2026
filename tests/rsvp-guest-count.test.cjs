const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');const fs=require('node:fs');
function load({allowed=true, affected=1}={}) {
 const calls=[];const m={exports:{}};
 const mocks={
 'server-only':{}, '@/lib/auth/rbac':{assertPermission:async p=>{assert.equal(p,'rsvp.write');if(!allowed)throw Error('denied');}},
 '@/lib/db/query':{dbExec:async(sql,params)=>{calls.push({sql,params});return affected;}},
 '@/platform/core/config/active-event':{getActiveEventConfig:()=>({slug:'test-event'})},
 };
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync('platform/engines/dashboard/rsvp/queries.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(n=>mocks[n]||{},m,m.exports);
 return {update:m.exports.updateDashboardRsvpGuestCount,calls};
}
test('guest update scopes event and checks previous count without changing status or sending messages',async()=>{
 const {update,calls}=load();assert.deepEqual(await update('id',6,4),{ok:true});
 assert.equal(calls.length,1);assert.deepEqual(calls[0].params,{id:'id',count:6,expectedCount:4,slug:'test-event'});
 assert.match(calls[0].sql,/event_slug = @slug AND number_of_attendees = @expectedCount/);
 assert.doesNotMatch(calls[0].sql,/SET status|contacted_at|email_status|sms_status/);
});
test('invalid values never reach database',async()=>{
 const {update,calls}=load();for(const n of [0,-1,1.5,NaN,Infinity,1001])assert.equal((await update('id',n,4)).ok,false);
 assert.equal(calls.length,0);
});
test('stale or missing booking fails and unauthorized writes are blocked',async()=>{
 assert.equal((await load({affected:0}).update('id',6,4)).ok,false);
 const denied=load({allowed:false});await assert.rejects(()=>denied.update('id',6,4),/denied/);assert.equal(denied.calls.length,0);
});
