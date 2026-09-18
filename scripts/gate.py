"""Mechanical gate over .work/candidates.raw.json. Writes .work/gated.json, READMEs under .work/, and data/candidates.json.

A repo passes when it is live, not a fork, not archived, created on or after
2026-09-01, has a README of at least 600 characters, and that README or the repo
description mentions Jev / TypeSafe / System One. Nothing here judges quality.
"""
import base64, json, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

raw = json.load(open(".work/candidates.raw.json"))
cands = raw["candidates"]
FIELDS = """nameWithOwner description url homepageUrl stargazerCount isArchived isFork isEmpty pushedAt createdAt
 licenseInfo{spdxId} primaryLanguage{name} defaultBranchRef{name}"""
meta = {}
for i in range(0, len(cands), 40):
    chunk = cands[i:i + 40]
    q = "query{" + "".join(
        f'r{j}: repository(owner:{json.dumps(c["repo"].split("/")[0])}, name:{json.dumps(c["repo"].split("/")[1])}){{{FIELDS}}}'
        for j, c in enumerate(chunk)) + "}"
    p = subprocess.run(["gh", "api", "graphql", "-f", f"query={q}"], capture_output=True, text=True)
    data = (json.loads(p.stdout or "{}").get("data") or {})
    for j, c in enumerate(chunk):
        meta[c["repo"]] = data.get(f"r{j}")
    print(f"meta {i + len(chunk)}/{len(cands)}", file=sys.stderr)

MENTION = re.compile(r"\bjev\b|typesafe|system[ -]?one|systemone", re.I)
os.makedirs(".work/readmes", exist_ok=True)


def readme(repo):
    fn = ".work/readmes/" + repo.replace("/", "__") + ".md"
    if os.path.exists(fn):
        return fn, open(fn, errors="replace").read()
    p = subprocess.run(["gh", "api", f"repos/{repo}/readme"], capture_output=True, text=True)
    if p.returncode:
        return None, ""
    text = base64.b64decode(json.loads(p.stdout)["content"]).decode("utf-8", "replace")
    open(fn, "w").write(text)
    return fn, text


stage1, drop = [], {}
for c in cands:
    m = meta.get(c["repo"])
    why = (not m and "gone") or (m["isFork"] and "fork") or (m["isArchived"] and "archived") or (m["isEmpty"] and "empty") \
        or (m["createdAt"][:10] < "2026-09-01" and not any(v.startswith("code:") for v in c["via"]) and "predates launch") or None
    if why:
        drop[why] = drop.get(why, 0) + 1
    else:
        stage1.append(c)
print(f"stage1 {len(stage1)} of {len(cands)}; dropped {drop}", file=sys.stderr)

with ThreadPoolExecutor(8) as ex:
    texts = list(ex.map(lambda c: readme(c["repo"]), stage1))

out, drop2 = [], {}
for c, (fn, text) in zip(stage1, texts):
    m = meta[c["repo"]]
    # canonical name: GitHub may have redirected a renamed repo
    why = (not fn and "no readme") or (len(text) < 600 and "readme under 600 chars") \
        or (not MENTION.search(text + " " + (m["description"] or "")) and "never mentions jev/typesafe") or None
    if why:
        drop2[why] = drop2.get(why, 0) + 1
        continue
    lic = (m["licenseInfo"] or {}).get("spdxId")
    out.append({"repo": m["nameWithOwner"], "url": m["url"], "description": m["description"], "homepage": m["homepageUrl"] or None,
                "stars": m["stargazerCount"], "license": None if lic in (None, "NOASSERTION") else lic,
                "language": (m["primaryLanguage"] or {}).get("name"), "pushedAt": m["pushedAt"][:10], "createdAt": m["createdAt"][:10],
                "callsApi": any(v.startswith("code:") for v in c["via"]), "via": c["via"], "listed": c["listed"],
                "readme": fn, "readmeChars": len(text)})
seen, uniq = set(), []
for o in out:
    if o["repo"].lower() not in seen:
        seen.add(o["repo"].lower()); uniq.append(o)
ABOUT = re.compile(r"\\bjev\\b|typesafe|system[ -]?one|systemone", re.I)
for o in uniq:  # "about Jev": named for it, or mentions it at least six times; drops big general repos that mention it once
    o["about"] = bool(ABOUT.search(o["repo"].split("/")[1] + " " + (o["description"] or ""))) or len(ABOUT.findall(open(o["readme"], errors="replace").read())) >= 6
json.dump(uniq, open(".work/gated.json", "w"), indent=1)
pub = [{"repo": o["repo"], "via": o["via"], "codeReferencesApi": o["callsApi"], "listed": o["listed"]} for o in uniq if o["about"]]
json.dump({"swept": raw["swept"], "found": raw["count"], "passedChecks": len(uniq), "aboutJev": len(pub),
           "note": "Only repos that passed the mechanical checks and are about Jev are recorded here. The raw sweep is not published.",
           "candidates": sorted(pub, key=lambda c: c["repo"].lower())}, open("data/candidates.json", "w"), indent=1)
print(f"passed {len(uniq)}; dropped at readme stage {drop2}; callsApi {sum(o['callsApi'] for o in uniq)}; "
      f"already listed {sum(o['listed'] for o in uniq)}", file=sys.stderr)
