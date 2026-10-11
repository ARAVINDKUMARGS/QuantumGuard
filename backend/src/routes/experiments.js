import { Router } from "express";
import * as quantum from "../services/quantumClient.js";

const CIRCUITS = ["bell", "superposition"];

// Returns { error } for invalid input, otherwise { value } with defaults applied.
export function validate(body = {}) {
  const v = {
    circuit: body.circuit ?? "bell",
    shots: body.shots ?? 1024,
    noise: body.noise ?? 0.01,
    seed: body.seed ?? 42,
    optimization_level: body.optimization_level ?? 1,
  };
  const problems = [];
  if (!CIRCUITS.includes(v.circuit)) problems.push(`circuit must be one of: ${CIRCUITS.join(", ")}`);
  if (!Number.isInteger(v.shots) || v.shots < 100 || v.shots > 10000) problems.push("shots must be an integer between 100 and 10000");
  if (typeof v.noise !== "number" || !Number.isFinite(v.noise) || v.noise < 0 || v.noise > 0.05) problems.push("noise must be a number between 0 and 0.05");
  if (!Number.isInteger(v.seed) || v.seed < 0 || v.seed > 2147483647) problems.push("seed must be a non-negative 31-bit integer");
  if (!Number.isInteger(v.optimization_level) || v.optimization_level < 0 || v.optimization_level > 3) problems.push("optimization_level must be an integer 0-3");
  return problems.length ? { error: problems } : { value: v };
}

const handler = (fn) => async (req, res, next) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).json({ error: "Validation failed", details: error });
  try {
    res.json(await fn(value));
  } catch (err) {
    next(err);
  }
};

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    res.json({ status: "ok", service: "backend", engine: await quantum.engineHealth() });
  } catch (err) {
    res.status(err.status ?? 503).json({ status: "degraded", service: "backend", engine: "unavailable", error: err.message });
  }
});
router.post("/simulate", handler(quantum.simulate));
router.post("/optimize", handler(quantum.optimize));

export default router;
