"""Measure Jev round-trip latency on one warm HTTPS connection.

Varies question count to check the vendor claim that questions are evaluated
in parallel within a call. Prints JSON; stdlib only.
"""
import http.client, json, os, statistics, time

KEY = os.environ["TYPESAFE_API_KEY"]
STATE = ("Hi, I've been trying to connect my Stripe account for 3 days and it "
         "keeps failing. I'm losing sales. Please help ASAP.")

def question(i):
    return {"type": "noul", "instructions": f"Variant {i}: does this message express urgency?"}

def run(conn, n_questions):
    body = json.dumps({"state": STATE, "model": "jev-latest",
                       "questions": {f"q{i}": question(i) for i in range(n_questions)}})
    t0 = time.perf_counter()
    conn.request("POST", "/v1/systemone", body=body, headers={
        "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    resp = conn.getresponse()
    data = json.loads(resp.read())
    ms = (time.perf_counter() - t0) * 1000
    return resp.status, ms, data.get("usage", data)

conn = http.client.HTTPSConnection("api.typesafe.ai", timeout=60)
run(conn, 1)  # warm up: TLS handshake excluded from the samples below
out = {}
for n in (1, 5, 10, 25, 50, 100, 200):
    samples, usage, status = [], None, None
    for _ in range(40):
        status, ms, usage = run(conn, n)
        samples.append(ms)
    out[n] = {"status": status, "p50_ms": round(statistics.median(samples)),
              "p90_ms": round(sorted(samples)[int(len(samples) * 0.9)]),
              "min_ms": round(min(samples)), "max_ms": round(max(samples)),
              "samples_ms": [round(x) for x in samples], "usage": usage}
print(json.dumps(out, indent=2))
