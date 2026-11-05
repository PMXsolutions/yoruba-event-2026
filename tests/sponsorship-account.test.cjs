const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function load(file) {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(require, loaded, loaded.exports);
  return loaded.exports;
}

const account = load("platform/engines/sponsors/account.ts");

test("association bank details normalise to the stored digits", () => {
  const parsed = account.parseSponsorshipAccountInput({
    accountName: "Yoruba Association in ACT",
    bsb: "062-904",
    accountNumber: "10 585 388",
    bankName: "  ",
    instructions: account.DEFAULT_SPONSORSHIP_INSTRUCTIONS,
    visible: true,
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.bsb, "062904");
  assert.equal(parsed.value.accountNumber, "10585388");
  assert.equal(parsed.value.bankName, null);
  assert.equal(account.formatBsb(parsed.value.bsb), "062-904");
  const pub = account.toPublicSponsorshipAccount({ ...parsed.value, updatedAt: null });
  assert.equal(pub.bsbDisplay, "062-904");
  assert.equal(pub.bsbDigits, "062904");
  assert.equal(pub.accountName, "Yoruba Association in ACT");
});

test("account details reject an incomplete BSB or account number", () => {
  assert.equal(
    account.parseSponsorshipAccountInput({
      accountName: "Yoruba Association in ACT",
      bsb: "06290",
      accountNumber: "10585388",
    }).ok,
    false,
  );
  assert.equal(
    account.parseSponsorshipAccountInput({
      accountName: "Yoruba Association in ACT",
      bsb: "062904",
      accountNumber: "123",
    }).ok,
    false,
  );
  assert.equal(account.normalizeBsb("062904"), "062904");
  assert.equal(account.normalizeAccountNumber("10585388"), "10585388");
});
