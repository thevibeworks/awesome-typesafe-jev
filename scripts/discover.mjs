// Sweep GitHub for repos related to TypeSafe Jev and write .work/candidates.raw.json (not committed:
// a raw sweep contains spam and unrelated repos). scripts/gate.py turns it into data/candidates.json.
// Arms: repository search, topic search, code search (repos that actually call the API
// or import an SDK), and any extra owner/repo names passed on stdin (one per line).
// Needs GITHUB_TOKEN: code search is not available unauthenticated.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error("GITHUB_TOKEN is required"); process.exit(1); }
const H = { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "awesome-typesafe-jev" };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SINCE = "2026-09-01"; // Jev launched 2026-09-15; earlier repos named "jev" are something else.

const REPO_QUERIES = [
  "typesafe jev", "jev typesafe-ai", "jev systemone", "\"system one\" jev", "typesafe-sdk", "typesafe_sdk",
  "jev in:name", "jev in:description", "jev in:readme typesafe", "typesafe.ai in:readme", "systemone in:readme typesafe",
  "openjev", "jev-mcp", "jev browser", "jev agent", "jev skill", "noul choice score",
  "topic:jev", "topic:typesafe", "topic:typesafe-ai", "topic:typesafe-jev", "topic:system-one", "topic:systemone",
];
const CODE_QUERIES = [
  "api.typesafe.ai", "\"v1/systemone\"", "typesafe_sdk", "\"typesafe-sdk\"", "\"@typesafe-ai/sdk\"",
  "TYPESAFE_API_KEY", "\"jev-latest\"", "\"jev-1.13\"", "TypeSafeClient",
];

const found = new Map(); // "owner/repo" lowercased -> { repo, via: Set }
const note = (full, via) => { const k = full.toLowerCase();
  if (!found.has(k)) found.set(k, { repo: full, via: new Set() }); found.get(k).via.add(via); };

async function get(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: H });
    if (res.status === 403 || res.status === 429) {
      const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000, retry = Number(res.headers.get("retry-after")) * 1000;
      const wait = Math.min(Math.max(retry || reset - Date.now() || 0, 5000), 70000);
      console.error(`  rate limited, waiting ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    if (res.status === 422) return null; // past the 1000-result window
    if (!res.ok) { console.error(`  HTTP ${res.status} ${url}`); return null; }
    return res.json();
  }
  return null;
}

for (const q of REPO_QUERIES) {
  const query = encodeURIComponent(`${q} created:>=${SINCE} fork:false`);
  let n = 0;
  for (let page = 1; page <= 10; page++) {
    const j = await get(`https://api.github.com/search/repositories?q=${query}&per_page=100&page=${page}&sort=updated`);
    if (!j?.items?.length) break;
    j.items.forEach(r => note(r.full_name, `repo:${q}`)); n += j.items.length;
    if (j.items.length < 100) break; await sleep(2200);
  }
  console.error(`repo  ${String(n).padStart(4)}  ${q}`); await sleep(2200);
}

for (const q of CODE_QUERIES) {
  let n = 0;
  for (let page = 1; page <= 10; page++) {
    const j = await get(`https://api.github.com/search/code?q=${encodeURIComponent(q)}&per_page=100&page=${page}`);
    if (!j?.items?.length) break;
    j.items.forEach(i => note(i.repository.full_name, `code:${q}`)); n += j.items.length;
    if (j.items.length < 100) break; await sleep(7000); // code search: 10 requests a minute
  }
  console.error(`code  ${String(n).padStart(4)}  ${q}`); await sleep(7000);
}

if (!process.stdin.isTTY) {
  const extra = readFileSync(0, "utf8").split("\n").map(s => s.trim()).filter(s => /^[\w.-]+\/[\w.-]+$/.test(s));
  extra.forEach(r => note(r, "list")); console.error(`list  ${String(extra.length).padStart(4)}  stdin`);
}

const listed = existsSync("data/entries.json")
  ? new Set(JSON.parse(readFileSync("data/entries.json", "utf8")).entries.map(e => (e.repo || "").toLowerCase())) : new Set();
const out = [...found.values()].map(f => ({ repo: f.repo, via: [...f.via].sort(), listed: listed.has(f.repo.toLowerCase()) }))
  .sort((a, b) => a.repo.toLowerCase().localeCompare(b.repo.toLowerCase()));
mkdirSync(".work", { recursive: true });
writeFileSync(".work/candidates.raw.json", JSON.stringify({ swept: new Date().toISOString().slice(0, 10), count: out.length, candidates: out }, null, 1) + "\n");
console.error(`\n${out.length} candidates (${out.filter(c => c.via.some(v => v.startsWith("code:"))).length} via code search, ${out.filter(c => c.listed).length} already listed)`);
