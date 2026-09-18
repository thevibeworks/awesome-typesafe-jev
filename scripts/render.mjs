// Render README.md and the site's data from data/entries.json.
// `--check` fails if the committed output is stale.
import { readFileSync, writeFileSync } from "node:fs";
import { CATEGORIES } from "./categories.mjs";

const SITE = "https://thevibeworks.github.io/awesome-typesafe-jev/";
const REPO = "thevibeworks/awesome-typesafe-jev";
const check = process.argv.includes("--check");
const data = JSON.parse(readFileSync("data/entries.json", "utf8"));
const lab = JSON.parse(readFileSync("data/lab.json", "utf8"));
const entries = data.entries;
const picks = entries.filter(e => e.pick);
const period = s => (/[.!?]$/.test(s) ? s : s + ".");
const anchor = t => t.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-");

function entryMd(e) {
  const meta = [e.license || "no license", e.language, e.live && `[live](${e.live})`].filter(Boolean).join(" · ");
  if (!e.pick) return `- [${e.name}](${e.url}) - ${period(e.what)} <sub>${meta}</sub>`;
  const lines = [`### [${e.name}](${e.url})`, ""];
  if (e.media) {
    const src = /^https:/.test(e.media.src) ? e.media.src : `docs/${e.media.src}`;
    lines.push(`<a href="${e.url}"><img src="${src}" alt="${e.name}: ${e.media.alt || e.what}" width="640"></a>`, "",
      `<sub>Media: ${e.media.credit}</sub>`, "");
  }
  lines.push(period(e.what), "", `**Why it is here:** ${period(e.evidence)}`);
  if (e.concern) lines.push("", `**Know before you use it:** ${period(e.concern)}`);
  lines.push("", `<sub>${meta}</sub>`, "");
  return lines.join("\n");
}

const sections = CATEGORIES.map(([id, title, blurb]) => {
  const list = entries.filter(e => e.category === id);
  if (!list.length) return null;
  const top = list.filter(e => e.pick), rest = list.filter(e => !e.pick);
  return { title, md: [`## ${title}`, "", blurb, "", ...top.map(entryMd), ...(rest.length ? [rest.map(entryMd).join("\n"), ""] : [])].join("\n") };
}).filter(Boolean);

const readme = `<!-- Rendered from data/entries.json by scripts/render.mjs. Edit the data, not this file. -->
# Awesome TypeSafe Jev [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

[![site](https://img.shields.io/badge/site-browse_with_media-1f6f4a)](${SITE})
[![entries](https://img.shields.io/badge/entries-${entries.length}-informational)](data/entries.json)
[![license: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

<p align="center">
  <a href="${SITE}"><img src="docs/assets/banner.svg" alt="Awesome TypeSafe Jev: a question goes in, a probability comes out" width="820"></a>
</p>

A curated list of projects built on [Jev](https://typesafe.ai), TypeSafe AI's System One model. Jev does not write text. You send a \`state\` and typed questions (Choice, Score, Noul) and get probabilities back.

**${entries.length} entries, ${picks.length} picks, every one read before it was listed.** Bigger lists exist and are linked [below](#other-lists). This one is short on purpose: of ${data.vetting.catalogued} catalogued repos, ${data.vetting.read} were read in full and ${entries.length} made it.

**[Browse the site](${SITE})** for media, filters and search. The data is one file: [\`data/entries.json\`](data/entries.json).

Not affiliated with TypeSafe AI.

## Contents

${[...sections.map(s => s.title), "Measured by us", "Other lists", "How entries get in", "Contributing"].map(t => `- [${t}](#${anchor(t)})`).join("\n")}

${sections.map(s => s.md).join("\n")}
## Measured by us

Numbers in vendor docs are the vendor's. These are ours, run against \`${lab.model}\` on ${lab.date} from one network location. Scripts and raw results are in [\`lab/\`](lab/).

<a href="${SITE}lab.html"><img src="docs/media/lab-latency.png" alt="Strip plot of Jev request latency by number of questions per call" width="720"></a>

${lab.findings.map(f => `- ${f}`).join("\n")}

[Open the interactive version](${SITE}lab.html).

## Other lists

${data.otherLists.map(l => `- [${l.name}](${l.url}) - ${period(l.note)}`).join("\n")}

## How entries get in

1. The README is read in full. Stars are not a criterion: the median catalogued repo has ${data.vetting.medianStars} star.
2. It does something concrete with Jev, and the README shows how to run it or shows it running.
3. It is not a thin copy of the official SDKs or of a better entry.
4. The one-line description says what it does in plain words. No adjectives doing the work of evidence.
5. A **pick** gets media and a "why it is here" line. Known weaknesses are printed, not hidden.

Media is copied into this repo only when the source repo's license allows it, and is credited. Otherwise it is linked.

## Contributing

Add an object to [\`data/entries.json\`](data/entries.json), run \`npm run validate && npm run render\`, open a PR. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

List and code: [MIT](LICENSE). Media belongs to its credited authors. "TypeSafe" and "Jev" are names of TypeSafe AI.
`;

const site = JSON.stringify({ updated: data.updated, vetting: data.vetting, categories: CATEGORIES, entries, otherLists: data.otherLists, lab }, null, 1) + "\n";
const outputs = { "README.md": readme, "docs/entries.json": site };

let stale = 0;
for (const [path, content] of Object.entries(outputs)) {
  if (check) {
    let cur = ""; try { cur = readFileSync(path, "utf8"); } catch {}
    if (cur !== content) { console.error(`stale: ${path} (run npm run render)`); stale++; }
  } else writeFileSync(path, content);
}
if (stale) process.exit(1);
console.log(check ? "render: up to date" : `rendered ${entries.length} entries (${picks.length} picks)`);
