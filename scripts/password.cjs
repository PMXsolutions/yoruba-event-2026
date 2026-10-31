const { randomBytes, scrypt } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);

/** Same format as lib/auth/password.ts: scrypt$<salt hex>$<hash hex>. */
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [algorithm, salt, hex] = String(stored).split("$");
  if (algorithm !== "scrypt" || !salt || !hex) return false;
  const actual = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  if (expected.length !== actual.length) return false;
  return actual.equals(expected);
}

module.exports = { hashPassword, verifyPassword };
