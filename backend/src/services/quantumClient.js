// HTTP client for the FastAPI quantum engine. Never fabricates data: failures surface as errors.
export class UpstreamError extends Error {
  constructor(status, message, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

const engineUrl = () => process.env.QUANTUM_ENGINE_URL || "http://127.0.0.1:8000";
const timeoutMs = () => Number(process.env.QUANTUM_TIMEOUT_MS || 30000);

async function call(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const res = await fetch(`${engineUrl()}${path}`, { ...options, signal: controller.signal });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      // 4xx from engine (validation) pass through; 5xx become 502
      const status = res.status >= 400 && res.status < 500 ? res.status : 502;
      throw new UpstreamError(status, "Quantum engine rejected the request", body?.detail ?? body);
    }
    return body;
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    if (err.name === "AbortError")
      throw new UpstreamError(504, `Quantum engine timed out after ${timeoutMs()} ms`);
    throw new UpstreamError(503, "Quantum engine unavailable. Is FastAPI running on port 8000?", err.message);
  } finally {
    clearTimeout(timer);
  }
}

const post = (path, body) =>
  call(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const engineHealth = () => call("/health");
export const simulate = (body) => post("/simulate", body);
export const optimize = (body) => post("/optimize", body);
