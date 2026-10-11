// Thin client for the Express API. No fallbacks: errors propagate to the UI.
const BASE = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new ApiError("Cannot reach the QuantumGuard API. Is the Express server running on port 4000?", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error || `Request failed (${res.status})`, res.status, body?.details);
  return body;
}

const post = (path, payload) =>
  request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

export const getHealth = () => request("/api/health");
export const simulate = (payload) => post("/api/simulate", payload);
export const optimize = (payload) => post("/api/optimize", payload);
