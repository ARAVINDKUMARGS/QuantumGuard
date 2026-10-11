// Tests the Express layer. A tiny stub upstream is used ONLY to exercise error paths
// (unavailable / 5xx / timeout); real results are verified by scripts/smoke-test.mjs.
import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";
import { createApp } from "../src/server.js";

let server, base, stub, mode = "down";

before(async () => {
  stub = http.createServer((req, res) => {
    if (mode === "500") { res.writeHead(500, { "content-type": "application/json" }); return res.end('{"detail":"boom"}'); }
    if (mode === "slow") return; // never respond -> timeout
    res.writeHead(200, { "content-type": "application/json" }); res.end('{"status":"ok"}');
  });
  await new Promise((r) => stub.listen(0, r));
  process.env.QUANTUM_TIMEOUT_MS = "300";
  server = createApp().listen(0);
  await new Promise((r) => server.on("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); stub.close(); stub.closeAllConnections?.(); });

const post = (path, body) => fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("validation rejects bad input with 400 before calling the engine", async () => {
  for (const body of [{ shots: 50 }, { shots: 20000 }, { noise: 0.06 }, { noise: "x" }, { circuit: "ghz" }, { optimization_level: 9 }]) {
    const r = await post("/api/simulate", body);
    assert.equal(r.status, 400);
    assert.ok((await r.json()).details.length > 0);
  }
});

test("engine unavailable -> 503 (no fallback data)", async () => {
  process.env.QUANTUM_ENGINE_URL = "http://127.0.0.1:1";
  const r = await post("/api/simulate", { shots: 100 });
  assert.equal(r.status, 503);
  const h = await fetch(base + "/api/health");
  assert.equal(h.status, 503);
  assert.equal((await h.json()).status, "degraded");
});

test("engine 500 -> 502, engine hang -> 504", async () => {
  process.env.QUANTUM_ENGINE_URL = `http://127.0.0.1:${stub.address().port}`;
  mode = "500";
  assert.equal((await post("/api/optimize", {})).status, 502);
  mode = "slow";
  assert.equal((await post("/api/simulate", {})).status, 504);
});

test("healthy engine proxies health", async () => {
  mode = "ok";
  const r = await fetch(base + "/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ok");
});

test("malformed JSON -> 400", async () => {
  const r = await fetch(base + "/api/simulate", { method: "POST", headers: { "content-type": "application/json" }, body: "{bad" });
  assert.equal(r.status, 400);
});
