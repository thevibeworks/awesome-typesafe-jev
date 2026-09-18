// Refresh volatile GitHub fields (stars, last push, license, archived) in data/entries.json.
// Set GITHUB_TOKEN to avoid the unauthenticated rate limit.
import { readFileSync, writeFileSync } from "node:fs";

const path = "data/entries.json";
const data = JSON.parse(readFileSync(path, "utf8"));
const headers = { "User-Agent": "awesome-typesafe-jev", Accept: "application/vnd.github+json",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };

let gone = 0;
for (const e of data.entries) {
  if (!e.repo) continue;
  const res = await fetch(`https://api.github.com/repos/${e.repo}`, { headers });
  if (res.status === 404) { console.error(`gone: ${e.repo}`); gone++; continue; }
  if (!res.ok) { console.error(`${e.repo}: HTTP ${res.status}`); process.exit(1); }
  const r = await res.json();
  if (r.full_name.toLowerCase() !== e.repo.toLowerCase()) console.error(`renamed: ${e.repo} -> ${r.full_name}`);
  Object.assign(e, { stars: r.stargazers_count, pushedAt: r.pushed_at.slice(0, 10),
    license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : null,
    language: r.language || null, archived: r.archived || undefined });
}
data.updated = new Date().toISOString().slice(0, 10);
writeFileSync(path, JSON.stringify(data, null, 1) + "\n");
console.log(`refreshed ${data.entries.length} entries, ${gone} gone`);
process.exit(gone ? 1 : 0);
