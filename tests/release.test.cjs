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
function dispatchHarness({ enabled = true, consent = true, ready = true, result = {ok:true,id:'provider-id'}, persistFailure = false, sendThrows = false, missingColumn = false } = {}) {
  const writes = [], events = []; let sends = 0;
  const {dispatchRsvpNotifications} = load('platform/engines/notifications/dispatch.ts', {
    '@/platform/core/flags': {getFeatureFlags:()=>({emailConfirmationsEnabled:enabled,smsEnabled:false})},
    '@/lib/activity/log': {logActivity:async x=>events.push(x.action)},
    '@/platform/engines/notifications/delivery': {updateRsvpEmailDelivery:async x=>{writes.push(x.status);if(missingColumn){const err=new Error('column email_status does not exist');err.name='DeliveryColumnMissingError';throw err;}if(persistFailure)throw Error('DB unavailable');}, isDeliveryColumnMissingError:(error)=>error instanceof Error && error.name==='DeliveryColumnMissingError', updateRsvpSmsDelivery:async()=>{}},
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
test('missing delivery columns still send the confirmation',async()=>{const h=dispatchHarness({missingColumn:true});const result=await h.run();assert.equal(result.emailSent,true);assert.equal(result.emailStatus,'sent');assert.equal(h.sends,1);});
test('missing id fails explicitly',async()=>{const h=dispatchHarness();await assert.rejects(h.run(null));assert.equal(h.sends,0);});
test('status write detects no matching row',async()=>{
 const {updateRsvpEmailDelivery}=load('platform/engines/notifications/delivery.ts',{'@/lib/db/query':{dbQuery:async()=>[]}});
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
 const {submitRsvpToDatabase}=load('platform/engines/rsvp/submit.ts',{
  '@/lib/db/query':{dbOne:async()=>null, dbExec:async(_sql, params)=>{inserted=params; return 1;}},
  '@/lib/db/connection':{getDatabaseEnvPresence:()=>({ready:true})},
  '@/platform/core/flags':{getFeatureFlags:()=>({publicRegistrationOpen:true})},
 });
 const result=await submitRsvpToDatabase({fullName:'Test',email:'test@example.invalid',attendees:1,ticketType:'General'},{slug:'test',ticketTypes:['General']});
 assert.equal(result.ok,true);assert.equal(result.record.id,inserted.id);assert.match(inserted.id,/^[0-9a-f-]{36}$/);assert.equal(inserted.email_status,'pending');
});
test('inactive profile and missing permission fail closed',async()=>{
 const rbac=load('lib/auth/rbac.ts',{
  '@/lib/auth/session':{readRequestSessionUserId:async()=>'test'},
  '@/lib/db/query':{dbOne:async()=>({is_active:false})},
 });
 assert.equal(await rbac.getAuthUser(),null);await assert.rejects(rbac.assertPermission('rsvp.read'));
});
test('missing communication columns save the registration without those fields',async()=>{
 const rows=[];
 const {submitRsvpToDatabase}=load('platform/engines/rsvp/submit.ts',{
  '@/lib/db/query':{dbOne:async()=>null, dbExec:async(_sql, params)=>{rows.push(params); if('email_consent' in params||'email_status' in params) throw new Error("Invalid column name 'email_consent'."); return 1;}},
  '@/lib/db/connection':{getDatabaseEnvPresence:()=>({ready:true})},
  '@/platform/core/flags':{getFeatureFlags:()=>({publicRegistrationOpen:true})},
 });
 const result=await submitRsvpToDatabase({fullName:'Test',email:'test@example.invalid',attendees:1,ticketType:'General',emailConsent:true},{slug:'test',ticketTypes:['General']});
 assert.equal(result.ok,true);assert.equal(rows.length,2);assert.equal('email_consent' in rows[1],false);assert.equal('email_status' in rows[1],false);assert.equal(result.record.email_consent,true);
});
test('missing rsvps table does not retry as a legacy insert',async()=>{
 let inserts=0;
 const {submitRsvpToDatabase}=load('platform/engines/rsvp/submit.ts',{
  '@/lib/db/query':{dbOne:async()=>null, dbExec:async()=>{inserts++; throw new Error('Invalid object name \'dbo.rsvps\'.');}},
  '@/lib/db/connection':{getDatabaseEnvPresence:()=>({ready:true})},
  '@/platform/core/flags':{getFeatureFlags:()=>({publicRegistrationOpen:true})},
 });
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

test('member actions deny unauthorised callers before service access', async()=>{
 const actions=load('app/actions/members.ts',{
  'next/cache':{revalidatePath(){}}, '@/lib/auth/rbac':{requireAuth:async()=>({ok:false,message:'Forbidden'})},
  '@/lib/db/query':{dbOne(){throw Error('must not access database');}, dbTransaction(){throw Error('must not access database');}},
 });
 assert.equal((await actions.inviteMember({name:'Test',email:'test@example.org'})).ok,false);
 assert.equal((await actions.changeMemberAccess({})).ok,false);
});
test('member access rejects self changes and invalid roles before the database',async()=>{
 const id='11111111-1111-4111-8111-111111111111';
 const actions=load('app/actions/members.ts',{'next/cache':{revalidatePath(){}},'@/lib/auth/rbac':{requireAuth:async()=>({ok:true,user:{id}})},'@/lib/db/query':{dbTransaction(){throw Error('must not query');}}});
 assert.equal((await actions.changeMemberAccess({id,role:'COMMITTEE',active:false})).ok,false);
 assert.equal((await actions.changeMemberAccess({id:'22222222-2222-4222-8222-222222222222',role:'OWNER',active:true})).ok,false);
});
test('member access reports database failures',async()=>{
 let called=false;
 const actions=load('app/actions/members.ts',{'next/cache':{revalidatePath(){}},'@/lib/auth/rbac':{requireAuth:async()=>({ok:true,user:{id:'11111111-1111-4111-8111-111111111111'}})},'@/lib/db/query':{dbTransaction:async()=>{called=true; throw new Error('rejected');}}});
 assert.equal((await actions.changeMemberAccess({id:'22222222-2222-4222-8222-222222222222',role:'COMMITTEE',active:false})).ok,false);
 assert.equal(called,true);
});
test('unreachable database is not reported as a generic save failure', () => {
  const { mapSupabaseRsvpError } = load('platform/engines/rsvp/errors.ts');
  const fetchFailed = mapSupabaseRsvpError('TypeError: fetch failed\n\nCaused by: Error: getaddrinfo ENOTFOUND example.supabase.co (ENOTFOUND)');
  assert.equal(fetchFailed.errorCode, 'NETWORK');
  assert.match(fetchFailed.userMessage, /could not reach our servers/i);
  const missingColumn = mapSupabaseRsvpError("Could not find the 'email_consent' column of 'rsvps' in the schema cache", 'PGRST204');
  assert.equal(missingColumn.errorCode, 'TABLE_MISSING');
  const constraint = mapSupabaseRsvpError('new row for relation "rsvps" violates check constraint "rsvps_email_status_check"', '23514');
  assert.equal(constraint.errorCode, 'CONSTRAINT');
});
test('the site dials the local SQL Express instance', () => {
  const { sqlDialHost, sqlTlsServerName, parseSqlInstanceId, parseSqlInstancePort } = load('lib/db/connection.ts');
  assert.equal(sqlDialHost('VMI3197632', 'SQLEXPRESS'), '127.0.0.1');
  assert.equal(sqlDialHost('localhost', 'SQLEXPRESS'), '127.0.0.1');
  assert.equal(sqlDialHost('db.example.com', 'SQLEXPRESS'), 'db.example.com');
  assert.equal(sqlTlsServerName('VMI3197632'), 'VMI3197632');
  assert.equal(sqlTlsServerName('127.0.0.1'), 'localhost');
  assert.equal(sqlTlsServerName('localhost'), 'localhost');
  const names = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\Instance Names\\SQL\r\n    SQLEXPRESS    REG_SZ    MSSQL16.SQLEXPRESS\r\n';
  assert.equal(parseSqlInstanceId(names, 'SQLEXPRESS'), 'MSSQL16.SQLEXPRESS');
  const dynamic = '    TcpDynamicPorts    REG_SZ    49670\r\n    TcpPort    REG_SZ    \r\n';
  assert.equal(parseSqlInstancePort(dynamic), 49670);
  const fixed = '    TcpDynamicPorts    REG_SZ    49670\r\n    TcpPort    REG_SZ    1433\r\n';
  assert.equal(parseSqlInstancePort(fixed), 1433);
  assert.equal(parseSqlInstancePort('    TcpPort    REG_SZ    \r\n'), undefined);
});
test('quoted SQL Server connection string is usable', () => {
  const { parseMssqlConnectionString, getMssqlConnectionSettings, getDatabaseEnvPresence } = load('lib/db/connection.ts');
  const parsed = parseMssqlConnectionString('Server=VMI3197632\\SQLEXPRESS;Database=YorubaDayCanberra;User Id=yorubaday_admin;Password="secret";Encrypt=true;TrustServerCertificate=true;');
  assert.equal(parsed.server, 'VMI3197632');
  assert.equal(parsed.instanceName, 'SQLEXPRESS');
  assert.equal(parsed.database, 'YorubaDayCanberra');
  assert.equal(parsed.user, 'yorubaday_admin');
  assert.equal(parsed.password, '"secret"');
  const doubled = parseMssqlConnectionString('Server=VMI3197632\\\\SQLEXPRESS;Database=YorubaDayCanberra;User Id=yorubaday_admin;Password=secret;Encrypt=true;TrustServerCertificate=true;');
  assert.equal(doubled.server, 'VMI3197632');
  assert.equal(doubled.instanceName, 'SQLEXPRESS');
  const prev = { ...process.env };
  try {
    delete process.env.MSSQL_CONNECTION_STRING;
    delete process.env.MSSQL_INSTANCE;
    process.env.MSSQL_SERVER = 'VMI3197632\\SQLEXPRESS';
    process.env.MSSQL_DATABASE = 'YorubaDayCanberra';
    process.env.MSSQL_USER = 'yorubaday_admin';
    process.env.MSSQL_PASSWORD = 'secret';
    const settings = getMssqlConnectionSettings();
    assert.equal(settings.server, 'VMI3197632');
    assert.equal(settings.instanceName, 'SQLEXPRESS');
    assert.equal(getDatabaseEnvPresence().server, 'VMI3197632\\SQLEXPRESS');
  } finally {
    process.env = prev;
  }
});
test('deploy env writes the SQL Server name with one backslash', () => {
  const { spawnSync } = require('node:child_process');
  const os = require('node:os');
  const target = path.join(os.tmpdir(), `yoruba-deploy-env-${process.pid}.env`);
  const prev = { ...process.env };
  delete process.env.MSSQL_CONNECTION_STRING;
  delete process.env.MSSQL_SERVER;
  delete process.env.MSSQL_INSTANCE;
  process.env.MSSQL_PASSWORD = 'secret';
  try {
    const result = spawnSync(process.execPath, ['scripts/write-deploy-env.mjs', target], { encoding: 'utf8', env: process.env });
    assert.equal(result.status, 0, result.stderr);
    const text = fs.readFileSync(target, 'utf8');
    const line = text.split(/\n/).find((entry) => entry.startsWith('MSSQL_SERVER='));
    const value = line.slice('MSSQL_SERVER='.length).replace(/^"|"$/g, '');
    assert.equal(value, 'VMI3197632\\SQLEXPRESS');
    assert.equal(value.includes('\\\\'), false);
    const doubled = spawnSync(process.execPath, ['scripts/write-deploy-env.mjs', target], {
      encoding: 'utf8',
      env: { ...process.env, MSSQL_CONNECTION_STRING: 'Server=VMI3197632\\\\SQLEXPRESS;Database=YorubaDayCanberra;User Id=yorubaday_admin;Password=secret;' },
    });
    assert.equal(doubled.status, 0, doubled.stderr);
    const rewritten = fs.readFileSync(target, 'utf8');
    const connection = rewritten.split(/\n/).find((entry) => entry.startsWith('MSSQL_CONNECTION_STRING='));
    assert.match(connection, /Server=VMI3197632\\SQLEXPRESS;/);
    assert.equal(connection.includes('VMI3197632\\\\'), false);
  } finally {
    process.env = prev;
    fs.rmSync(target, { force: true });
  }
});
test('the Windows package refuses pages whose JavaScript is missing', () => {
  const { spawnSync } = require('node:child_process');
  const os = require('node:os');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yoruba-deploy-'));
  const deploy = path.join(root, 'deploy');
  const recycle = path.join(root, 'recycle');
  const write = (relative, contents) => {
    const full = path.join(deploy, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  };
  write('server.js', "require('next')\n");
  write('preload.cjs', '');
  write('start-node.cmd', '');
  write('.env', 'MSSQL_SERVER="127.0.0.1\\SQLEXPRESS"\n');
  write('web.config', '<configuration><system.webServer><httpPlatform /></system.webServer></configuration>\n');
  write('.next/BUILD_ID', 'build');
  write('.next/static/chunks/app.js', 'ok');
  write('.next/static/css/app.css', 'ok');
  write('.next/server/app/index.html', '<script src="/_next/static/chunks/app.js"></script><link href="/_next/static/css/app.css"/>');
  try {
    const ok = spawnSync(process.execPath, ['scripts/prepare-windows-deploy.mjs', deploy, recycle, 'run-1'], { encoding: 'utf8' });
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(fs.readFileSync(path.join(recycle, 'web.config'), 'utf8'), /recycle run-1/);
    write('.next/server/app/index.html', '<script src="/_next/static/chunks/missing.js"></script>');
    const broken = spawnSync(process.execPath, ['scripts/prepare-windows-deploy.mjs', deploy, recycle, 'run-2'], { encoding: 'utf8' });
    assert.equal(broken.status, 1);
    assert.match(broken.stderr, /missing\.js/);
    fs.mkdirSync(path.join(deploy, 'node_modules'));
    write('.next/server/app/index.html', '<script src="/_next/static/chunks/app.js"></script>');
    const withModules = spawnSync(process.execPath, ['scripts/prepare-windows-deploy.mjs', deploy, recycle, 'run-3'], { encoding: 'utf8' });
    assert.equal(withModules.status, 1);
    assert.match(withModules.stderr, /node_modules/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test('vanity SMTP host verifies TLS against its CNAME target', async () => {
  const prev = { ...process.env };
  process.env.SMTP_HOST = 'mail.promaxcare.com.au';
  process.env.SMTP_PORT = '465';
  process.env.SMTP_USER = 'events@promaxcare.com.au';
  process.env.SMTP_PASSWORD = 'secret';
  process.env.MAIL_FROM = 'Events <events@promaxcare.com.au>';
  let tls;
  try {
    const { sendViaSmtp } = load('platform/engines/notifications/email/smtp-client.ts', {
      nodemailer: {
        createTransport(options) {
          tls = options.tls;
          return { sendMail: async () => ({ messageId: 'accepted', response: '250 ok' }), close() {} };
        },
      },
      'node:dns': {
        promises: {
          resolveCname: async (host) => host === 'mail.promaxcare.com.au' ? ['mail5010.site4now.net.'] : Promise.reject(Object.assign(new Error('ENODATA'), { code: 'ENODATA' })),
        },
      },
    });
    const result = await sendViaSmtp({ to: 'guest@example.invalid', subject: 'Confirm', html: '<p>Hi</p>', text: 'Hi' });
    assert.equal(result.ok, true);
    assert.equal(tls.servername, 'mail5010.site4now.net');
    assert.equal(tls.minVersion, 'TLSv1.2');
  } finally {
    process.env = prev;
  }
});
test('resending invitation cannot reactivate an inactive member',async()=>{
 const actions=load('app/actions/members.ts',{
  'next/cache':{revalidatePath(){}},
  '@/lib/auth/rbac':{requireAuth:async()=>({ok:true,user:{id:'actor'}})},
  '@/lib/db/query':{dbOne:async()=>({id:'target',is_active:false})},
  '@/lib/auth/account-email':{issueAccountEmail(){throw Error('must not send');}},
 });
 assert.equal((await actions.inviteMember({name:'Member',email:'member@example.org'})).ok,false);
});
