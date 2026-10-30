#!/usr/bin/env node
/**
 * Check the folder that will be uploaded to IIS, then write the web.config
 * that is uploaded last. IIS restarts Node only when web.config changes.
 * Uploading it last means the new process starts after the new pages and
 * their JavaScript are already on disk.
 *
 * node_modules is not part of this folder. The Windows site already has that
 * directory, and server.js loads Next from it. Removing it would stop the app.
 */
import fs from "node:fs";
import path from "node:path";

const deployDir = process.argv[2];
const recycleDir = process.argv[3];
const deployId = process.argv[4];

if (!deployDir || !recycleDir || !deployId) {
  console.error("Usage: node scripts/prepare-windows-deploy.mjs <deploy-dir> <recycle-dir> <deploy-id>");
  process.exit(1);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function assertFile(relativePath) {
  if (!fs.existsSync(path.join(deployDir, relativePath))) fail(`missing ${relativePath}`);
}

for (const relativePath of [
  "server.js",
  "preload.cjs",
  "start-node.cmd",
  ".env",
  "web.config",
  ".next/BUILD_ID",
  ".next/server/app/index.html",
]) {
  assertFile(relativePath);
}

if (!fs.existsSync(path.join(deployDir, ".next", "static"))) {
  fail(".next/static was not copied next to the standalone server.");
}

if (fs.existsSync(path.join(deployDir, "node_modules"))) {
  fail("deploy/node_modules must stay out of the upload. The site already has node_modules, and replacing it is a separate full upload.");
}

const serverSource = fs.readFileSync(path.join(deployDir, "server.js"), "utf8");
if (!serverSource.includes("require('next')") && !serverSource.includes('require("next")')) {
  fail("server.js does not load Next. The node_modules folder already on the server would not be used.");
}

const assetPattern = /\/_next\/static\/[^"'\\\s)]+/g;
const pages = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.name.endsWith(".html") || entry.name.endsWith(".rsc")) pages.push(fullPath);
  }
}

walk(path.join(deployDir, ".next", "server"));

const missing = [];
let references = 0;
for (const page of pages) {
  const text = fs.readFileSync(page, "utf8");
  for (const match of text.matchAll(assetPattern)) {
    references += 1;
    const assetPath = match[0].split("?")[0].replace(/^\/_next\//, ".next/");
    if (!fs.existsSync(path.join(deployDir, assetPath))) {
      missing.push(`${match[0]} referenced by ${path.relative(deployDir, page)}`);
    }
  }
}

if (references === 0) fail("the built pages do not reference any /_next/static files.");
if (missing.length > 0) {
  console.error("ERROR: the built HTML points at files that are not in the deploy package:");
  for (const item of missing) console.error(`  ${item}`);
  process.exit(1);
}

const webConfigPath = path.join(deployDir, "web.config");
const webConfig = fs.readFileSync(webConfigPath, "utf8");
if (!webConfig.includes("httpPlatform") || !webConfig.includes("</configuration>")) {
  fail("web.config is not the IIS HttpPlatformHandler file.");
}

const stamped = webConfig.replace(
  "</configuration>",
  `  <!-- recycle ${deployId} -->\n</configuration>\n`,
);
fs.mkdirSync(recycleDir, { recursive: true });
fs.writeFileSync(path.join(recycleDir, "web.config"), stamped);
console.log(`Checked ${references} static references in ${pages.length} server pages.`);
console.log(`Wrote recycle web.config for ${deployId}. node_modules is left untouched on the server.`);
