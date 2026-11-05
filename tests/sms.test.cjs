const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function load(file, mocks = {}, cache = new Map()) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const loaded = { exports: {} };
  cache.set(absolute, loaded);
  const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === "server-only") return {};
    if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`, mocks, cache);
    return require(id);
  };
  new Function("require", "module", "exports", code)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

const format = load("platform/engines/notifications/sms/format.ts");
const config = load("platform/engines/notifications/sms/config.ts");

test("australian numbers match the DirectSMS prefix rules", () => {
  assert.equal(format.normalizeSmsRecipient("0412345678"), "61412345678");
  assert.equal(format.normalizeSmsRecipient("+61412345678"), "61412345678");
  assert.equal(format.normalizeSmsRecipient("61412345678"), "61412345678");
  assert.equal(format.normalizeSmsRecipient("412345678"), "61412345678");
  assert.equal(format.normalizeSmsRecipient("0412 345 678"), "61412345678");
  assert.equal(format.normalizeSmsRecipient("+44 7911 123456"), "447911123456");
  assert.equal(format.normalizeSmsRecipient("08031234567", "234"), "2348031234567");
  assert.equal(format.normalizeSmsRecipient(""), null);
  assert.equal(format.normalizeSmsRecipient("61"), null);
  assert.equal(format.normalizeSmsRecipient("12"), null);
});

test("reminder template keeps known placeholders only", () => {
  const text = format.renderSmsTemplate(format.DEFAULT_SMS_REMINDER_TEMPLATE, {
    firstName: "Ada",
    eventName: "Yoruba Day Canberra 2026",
    date: "22 November 2026",
    location: "Canberra, ACT",
    website: "https://yorubaassociationact.org",
  });
  assert.match(text, /Ada/);
  assert.equal(text.includes("{"), false);
  assert.equal(format.validateSmsReminderTemplate("Hello {nickname}"), "Unknown placeholder: {nickname}.");
  assert.equal(format.validateSmsSenderId("YCD"), null);
  assert.equal(format.validateSmsSenderId("too long sender"), "Sender ID must be 1–11 letters or numbers.");
  assert.equal(format.isAllowedDirectSmsUrl("https://api.directsms.com.au/s3/http/send_message"), true);
  assert.equal(format.isAllowedDirectSmsUrl("https://example.com/s3/http/send_message"), false);
  assert.equal(format.isAllowedDirectSmsUrl("http://127.0.0.1/send_message"), false);
});

test("dashboard SMS settings override the environment flag and hide the password", () => {
  const env = {
    directsms: {
      username: "",
      password: "",
      senderId: "YCD",
      apiUrl: "https://api.directsms.com.au/s3/http/send_message",
      messageType: "1-way",
      countryCode: "61",
    },
    twilio: { accountSid: "AC123", authToken: "token", fromNumber: "+61400000000" },
  };
  const fromEnv = config.resolveSmsSettingsFromSources(null, env, true);
  assert.equal(fromEnv.provider, "twilio");
  assert.equal(fromEnv.enabled, true);
  assert.equal(fromEnv.ready, true);
  assert.equal(fromEnv.remindersEnabled, false);

  const stored = config.resolveSmsSettingsFromSources(
    {
      provider: "directsms",
      enabled: true,
      remindersEnabled: true,
      username: "committee",
      password: "stored-secret",
      hasPassword: true,
      credentialLocked: false,
      senderId: "YCD",
      apiUrl: "https://api.directsms.com.au/s3/http/send_message",
      messageType: "1-way",
      defaultCountryCode: "61",
      reminderTemplate: "Reminder {firstName}",
    },
    env,
    false,
  );
  assert.equal(stored.enabled, true);
  assert.equal(stored.provider, "directsms");
  assert.equal(stored.ready, true);
  const pub = config.toPublicSmsSettings(stored, true);
  assert.equal(pub.hasPassword, true);
  assert.equal("password" in pub, false);
  assert.equal(JSON.stringify(pub).includes("stored-secret"), false);
});

test("saved SMS password round-trips and is not stored in clear text", () => {
  const previous = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = "test-session-secret-with-32-characters";
  try {
    const secret = load("platform/engines/notifications/sms/secret.ts");
    const encoded = secret.encryptSecret("gateway-password-example");
    assert.equal(encoded.startsWith("v1:"), true);
    assert.equal(encoded.includes("gateway-password-example"), false);
    assert.equal(secret.decryptSecret(encoded), "gateway-password-example");
  } finally {
    if (previous === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previous;
  }
});
