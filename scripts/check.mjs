// check.mjs — run before every push:  node scripts/check.mjs
//
// Fails when:
//   1. a data-i18n key in the HTML has no Azerbaijani or Russian entry
//      (or a dictionary keeps a key nothing uses any more);
//   2. a price is written into a page or a dictionary instead of config.js;
//   3. a supplier or model name reaches the site (the customer never sees them);
//   4. a relative link or asset points at a file that does not exist;
//   5. config.js lost a plan field or the download link is not https.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = (msg) => errors.push(msg);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const html = files.filter((f) => f.endsWith(".html"));
const read = (f) => readFileSync(f, "utf8");

// Load config.js and i18n.js the way a browser would.
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(read(join(ROOT, "assets/config.js")), sandbox);
vm.runInContext(read(join(ROOT, "assets/i18n.js")), sandbox);
const C = sandbox.window.CUTTERLY;
const I18N = sandbox.window.SITE_I18N;

// 1. Keys ────────────────────────────────────────────────────────────────
const used = new Set(["ui.copy", "ui.copied", "unit.hours"]); // written by site.js
for (const f of html) {
  const src = read(f);
  for (const m of src.matchAll(/data-i18n="([^"]+)"/g)) used.add(m[1]);
  for (const m of src.matchAll(/data-i18n-attr="([^"]+)"/g))
    for (const pair of m[1].split(";")) used.add(pair.split(":")[1].trim());
  for (const m of src.matchAll(/data-site-unit="[^"|]+\|([^"]+)"/g)) used.add(m[1]);
}
for (const lang of ["az", "ru"]) {
  const dict = I18N[lang] || {};
  for (const k of used) if (!(k in dict)) fail(`i18n: "${k}" missing in ${lang}`);
  for (const k of Object.keys(dict)) if (!used.has(k)) fail(`i18n: "${k}" in ${lang} is not used by any page`);
}

// 2. Prices only in config.js ───────────────────────────────────────────
const priceLike = /\$\s?\d/;
for (const f of [...html, join(ROOT, "assets/i18n.js")]) {
  const text = read(f).replace(/<script[\s\S]*?<\/script>/g, "");
  if (priceLike.test(text)) fail(`price written into ${relative(ROOT, f)} — use data-site and config.js`);
}

// 3. No supplier or model names ─────────────────────────────────────────
const banned = /elevenlabs|gemini|openai|anthropic|claude|scribe_v|gpt-|railway/i;
for (const f of files) {
  if (f.endsWith("check.mjs")) continue;
  if (!/\.(html|js|css|md|svg|json|txt)$/.test(f)) continue;
  const m = read(f).match(banned);
  if (m) fail(`supplier name "${m[0]}" in ${relative(ROOT, f)}`);
}

// 4. Relative links and assets ──────────────────────────────────────────
for (const f of html) {
  const src = read(f);
  for (const m of src.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|#|data:)/.test(url)) continue;
    let target = resolve(dirname(f), url.split("#")[0].split("?")[0] || ".");
    if (url.split("#")[0] === "" ) continue;
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");
    if (!existsSync(target)) fail(`broken link ${url} in ${relative(ROOT, f)}`);
  }
}
// Links inside dictionary strings resolve against the page that shows them;
// they are checked by hand in review — here only make sure they are relative.
for (const lang of ["az", "ru"])
  for (const [k, v] of Object.entries(I18N[lang]))
    for (const m of String(v).matchAll(/href="([^"]+)"/g))
      if (/^https?:/.test(m[1])) fail(`absolute link in ${lang}.${k} — keep links relative`);

// 5. Config ─────────────────────────────────────────────────────────────
for (const [id, plan] of Object.entries(C.plans || {})) {
  if (!(plan.price > 0) || !(plan.hours > 0) || !plan.name) fail(`config: plan ${id} needs name, price, hours`);
}
if (!/^https:\/\//.test(C.downloadUrl || "")) fail("config: downloadUrl must be https");
if (!/^\d+\.\d+\.\d+$/.test(C.version || "")) fail("config: version must look like 1.0.6");
if (!/@/.test(C.supportEmail || "")) fail("config: supportEmail missing");

if (errors.length) {
  console.error(errors.map((e) => "✗ " + e).join("\n"));
  console.error(`\n${errors.length} problem(s).`);
  process.exit(1);
}
console.log(`✓ ${html.length} pages, ${used.size} keys × 2 languages, prices only in config.js, links resolve.`);
