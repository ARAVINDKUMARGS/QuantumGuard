// Live end-to-end smoke test: needs FastAPI (8000) and Express (4000) running.
import assert from "node:assert/strict";
const API = process.env.API_URL || "http://localhost:4000";
const post = (p, b) => fetch(API + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json() }));

const h = await fetch(API + "/api/health").then((r) => r.json());
assert.equal(h.status, "ok"); console.log("PASS /api/health", h.engine.qiskit_aer);
const s = await post("/api/simulate", { circuit: "bell", shots: 2000, noise: 0.03, seed: 42, optimization_level: 1 });
assert.equal(s.status, 200);
assert.equal(Object.values(s.body.ideal.counts).reduce((a, b) => a + b, 0), 2000);
assert.equal(Object.values(s.body.noisy.counts).reduce((a, b) => a + b, 0), 2000);
console.log("PASS /api/simulate TVD=" + s.body.total_variation_distance.toFixed(4));
const o = await post("/api/optimize", { circuit: "bell", shots: 1000, noise: 0.02, seed: 1 });
assert.equal(o.status, 200); assert.equal(o.body.levels.length, 4); console.log("PASS /api/optimize levels=4");
const bad = await post("/api/simulate", { shots: 5 }); assert.equal(bad.status, 400); console.log("PASS validation 400");
