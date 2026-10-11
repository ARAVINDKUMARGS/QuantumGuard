import cors from "cors";
import express from "express";
import { fileURLToPath } from "node:url";
import experiments from "./routes/experiments.js";
import { UpstreamError } from "./services/quantumClient.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
  app.use(express.json({ limit: "10kb" }));
  app.use("/api", experiments);
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof UpstreamError)
      return res.status(err.status).json({ error: err.message, details: err.detail ?? null });
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body" });
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });
  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4000);
  createApp().listen(port, () => console.log(`QuantumGuard API listening on http://localhost:${port}`));
}
