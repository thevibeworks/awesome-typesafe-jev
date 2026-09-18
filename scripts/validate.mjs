// Validate data/entries.json. Exits non-zero with every problem listed.
import { readFileSync, existsSync } from "node:fs";
import { CATEGORY_IDS, RESOURCE_SECTIONS } from "./categories.mjs";

const data = JSON.parse(readFileSync("data/entries.json", "utf8"));
const errs = [];
const bad = (id, msg) => errs.push(`${id}: ${msg}`);
const HYPE = /\b(powerful|blazing|seamless|awesome|revolutionary|cutting-edge|game-?chang|robust\b|supercharge)/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

if (!DATE.test(data.updated || "")) bad("root", "updated must be YYYY-MM-DD");
const seen = new Set();
for (const e of data.entries || []) {
  const id = e.repo || e.url || "(unnamed)";
  for (const f of ["name", "url", "category", "what", "added"])
    if (!e[f] || typeof e[f] !== "string") bad(id, `missing ${f}`);
  if (e.pick && !e.evidence) bad(id, "a pick needs evidence");
  if (e.category && !CATEGORY_IDS.includes(e.category)) bad(id, `unknown category ${e.category}`);
  if (e.repo && !/^[\w.-]+\/[\w.-]+$/.test(e.repo)) bad(id, "repo must be owner/name");
  if (e.url && !/^https:\/\//.test(e.url)) bad(id, "url must be https");
  if (e.what && e.what.length > 160) bad(id, `what is ${e.what.length} chars, max 160`);
  if (e.what && HYPE.test(e.what)) bad(id, "what contains marketing language");
  if (e.added && !DATE.test(e.added)) bad(id, "added must be YYYY-MM-DD");
  if (e.pick !== undefined && typeof e.pick !== "boolean") bad(id, "pick must be boolean");
  if (e.media) {
    if (!e.media.src || !e.media.credit) bad(id, "media needs src and credit");
    else if (!/^https:\/\//.test(e.media.src) && !existsSync(`docs/${e.media.src}`)) bad(id, `media file missing: docs/${e.media.src}`);
  }
  const key = (e.repo || e.url).toLowerCase();
  if (seen.has(key)) bad(id, "duplicate entry"); seen.add(key);
}
const res = JSON.parse(readFileSync("data/resources.json", "utf8")).resources;
const resIds = RESOURCE_SECTIONS.map(r => r[0]), resSeen = new Set();
for (const r of res) {
  const id = r.url || r.title || "(resource)";
  for (const f of ["title", "url", "section", "note"]) if (!r[f]) bad(id, `resource missing ${f}`);
  if (r.url && !/^https:\/\//.test(r.url)) bad(id, "resource url must be https");
  if (r.section && !resIds.includes(r.section)) bad(id, `unknown resource section ${r.section}`);
  if (r.note && r.note.length > 170) bad(id, `note is ${r.note.length} chars, max 170`);
  if (r.note && HYPE.test(r.note)) bad(id, "note contains marketing language");
  if (resSeen.has(r.url)) bad(id, "duplicate resource"); resSeen.add(r.url);
}
if (errs.length) { console.error(errs.join("\n")); console.error(`\n${errs.length} problem(s)`); process.exit(1); }
console.log(`ok: ${data.entries.length} entries, ${res.length} resources`);
