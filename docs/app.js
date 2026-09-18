// Renders the list from entries.json. State lives in the URL hash so filters are shareable.
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag);
  if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const link = (href, text, cls) => { const a = el("a", cls, text); a.href = href; a.rel = "noopener"; return a; };

// Entries without media get a tile of bars derived from the name, so every card has a face.
function tile(entry, label) {
  const t = el("div", "tile"), bars = el("div", "bars");
  let h = 2166136261;
  for (const ch of entry.repo || entry.name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  for (let i = 0; i < 5; i++) { const b = el("i"); h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    b.style.setProperty("--p", (0.18 + (h % 800) / 1000).toFixed(2)); bars.append(b); }
  t.append(bars, el("span", null, label)); return t;
}

function card(e, label) {
  const c = el("article", "card" + (e.pick ? " pick" : ""));
  const media = link(e.url, null, "media"); media.tabIndex = -1; media.setAttribute("aria-hidden", "true");
  if (e.media) { const img = el("img"); img.src = e.media.src; img.alt = ""; img.loading = "lazy"; img.decoding = "async"; media.append(img); }
  else if (e.pick) media.append(tile(e, label));
  const body = el("div", "body"), h = el("h3");
  const owner = e.repo ? e.repo.split("/")[0] + " / " : "";
  const a = link(e.url, null); a.append(el("span", "owner", owner), document.createTextNode(e.name)); h.append(a);
  if (e.pick) h.append(el("span", "badge", "pick"));
  body.append(h, el("p", "what", e.what + "."));
  if (e.pick) { const w = el("p", "why"); w.append(el("b", null, "Why it is here: "), document.createTextNode(e.evidence + ".")); body.append(w); }
  if (e.pick && e.concern) { const k = el("p", "know"); k.append(el("b", null, "Know first: "), document.createTextNode(e.concern + ".")); body.append(k); }
  const meta = el("div", "meta");
  meta.append(el("span", null, "★ " + e.stars.toLocaleString("en")), el("span", null, e.license || "no license"));
  if (e.language) meta.append(el("span", null, e.language));
  meta.append(el("span", null, "pushed " + e.pushedAt));
  if (e.live) meta.append(link(e.live, "live"));
  if (e.demo) meta.append(link(e.demo, "demo media"));
  body.append(meta);
  if (e.media) body.append(el("p", "credit", "media: " + e.media.credit));
  if (e.media || e.pick) c.append(media);
  c.append(body); return c;
}

const state = { q: "", c: "all", picks: false, sort: "curated" };
function readHash() { const p = new URLSearchParams(location.hash.slice(1));
  state.q = p.get("q") || ""; state.c = p.get("c") || "all"; state.picks = p.get("picks") === "1"; state.sort = p.get("sort") || "curated"; }
function writeHash() { const p = new URLSearchParams();
  if (state.q) p.set("q", state.q); if (state.c !== "all") p.set("c", state.c);
  if (state.picks) p.set("picks", "1"); if (state.sort !== "curated") p.set("sort", state.sort);
  history.replaceState(null, "", p.toString() ? "#" + p : location.pathname + location.search); }

function draw(data) {
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  const hit = e => (!state.picks || e.pick) && (state.c === "all" || e.category === state.c) &&
    words.every(w => [e.name, e.repo, e.what, e.evidence, e.language, e.category].join(" ").toLowerCase().includes(w));
  const sorters = { stars: (a, b) => b.stars - a.stars, recent: (a, b) => b.pushedAt.localeCompare(a.pushedAt) };
  const box = $("sections"); box.replaceChildren(); let shown = 0;
  for (const [id, title, blurb] of data.categories) {
    let list = data.entries.filter(e => e.category === id && hit(e));
    if (!list.length) continue;
    if (sorters[state.sort]) list = [...list].sort(sorters[state.sort]);
    shown += list.length;
    const sec = el("section", "sec"), grid = el("div", "grid");
    sec.append(el("h2", null, title), el("p", null, blurb));
    list.forEach(e => grid.append(card(e, title))); sec.append(grid); box.append(sec);
  }
  $("empty").hidden = shown > 0;
  $("count").textContent = `${shown} of ${data.entries.length} entries`;
  [...$("chips").children].forEach(b => b.setAttribute("aria-pressed", String(b.dataset.c === state.c)));
  $("q").value = state.q; $("picks").checked = state.picks; $("sort").value = state.sort;
}

fetch("entries.json").then(r => r.json()).then(data => {
  const v = data.vetting, funnel = $("funnel");
  for (const [k, n] of [["catalogued", v.catalogued], ["read in full", v.read], ["listed", v.kept]]) {
    const row = el("div"), bar = el("i"); bar.style.setProperty("--p", (n / v.catalogued).toFixed(3));
    row.append(el("span", null, k), bar, el("span", null, String(n))); funnel.append(row);
  }
  const chips = $("chips"), used = new Set(data.entries.map(e => e.category));
  for (const [id, title] of [["all", "All"], ...data.categories.filter(c => used.has(c[0]))]) {
    const b = el("button", null, id === "all" ? `All ${data.entries.length}` : `${title} ${data.entries.filter(e => e.category === id).length}`);
    b.type = "button"; b.dataset.c = id; b.onclick = () => { state.c = id; writeHash(); draw(data); }; chips.append(b);
  }
  data.lab.findings.forEach(f => $("findings").append(el("li", null, f)));
  data.otherLists.forEach(l => { const li = el("li"); li.append(link(l.url, l.name), document.createTextNode(" - " + l.note + ".")); $("others").append(li); });
  $("updated").textContent = data.updated;
  $("q").oninput = e => { state.q = e.target.value; writeHash(); draw(data); };
  $("picks").onchange = e => { state.picks = e.target.checked; writeHash(); draw(data); };
  $("sort").onchange = e => { state.sort = e.target.value; writeHash(); draw(data); };
  addEventListener("hashchange", () => { readHash(); draw(data); });
  readHash(); draw(data);
}).catch(err => { $("count").textContent = "Could not load entries.json: " + err.message; });
