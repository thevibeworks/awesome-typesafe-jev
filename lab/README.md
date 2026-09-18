# lab

First-hand measurements against the Jev API. Stdlib-only Python; each script reads
`TYPESAFE_API_KEY` from the environment.

    python3 lab/probe_breaks.py
    python3 lab/probe_latency.py > lab/probe_latency.result.json

- `probe_breaks.py`: 33 yes/no cases with a known answer, grouped by the failure modes
  TypeSafe documents, plus their recommended fix for counting. Writes
  `probe_breaks.result.json`.
- `probe_latency.py`: round-trip time against number of questions per call, 40 samples
  each, one warm HTTPS connection.

Limits: one network location, one day, cases written by us with one phrasing each.
Directional, not a benchmark. A full run is about 320 requests and costs well under one cent
at the listed price.
