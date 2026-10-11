import { Play, Loader2 } from "lucide-react";
import { LIMITS } from "../lib.js";

const field = "w-full rounded-md border border-navy-600 bg-navy-950 px-3 py-2 text-sm text-white focus:border-cyan-400";

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</label>
      {children}
      {error ? <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-rose-300">{error}</p>
             : hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function ControlPanel({ params, setParams, errors, onRun, loading }) {
  const set = (k, v) => setParams((p) => ({ ...p, [k]: v }));
  const num = (k) => (e) => set(k, e.target.value === "" ? NaN : Number(e.target.value));
  return (
    <section aria-label="Experiment controls" className="rounded-xl border border-navy-700 bg-navy-800 p-4">
      <h2 className="mb-4 text-sm font-semibold text-white">Experiment</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Field id="circuit" label="Circuit">
          <select id="circuit" className={field} value={params.circuit} onChange={(e) => set("circuit", e.target.value)}>
            <option value="bell">Bell state (H + CNOT, 2 qubits)</option>
            <option value="superposition">Single-qubit superposition (H)</option>
          </select>
        </Field>
        <Field id="shots" label="Shots" error={errors.shots} hint={`${LIMITS.shotsMin}–${LIMITS.shotsMax}`}>
          <input id="shots" type="number" step="1" min={LIMITS.shotsMin} max={LIMITS.shotsMax} className={field}
            value={Number.isNaN(params.shots) ? "" : params.shots} onChange={num("shots")} aria-invalid={!!errors.shots} aria-describedby={errors.shots ? "shots-err" : undefined} />
        </Field>
        <Field id="noise" label={`Noise strength p = ${Number.isNaN(params.noise) ? "–" : params.noise.toFixed(3)}`} error={errors.noise} hint="Depolarizing gate error + readout error">
          <input id="noise" type="range" min={LIMITS.noiseMin} max={LIMITS.noiseMax} step="0.001" className="w-full accent-cyan-400"
            value={Number.isNaN(params.noise) ? 0 : params.noise} onChange={num("noise")} />
        </Field>
        <Field id="seed" label="Seed" error={errors.seed} hint="Same seed → same counts">
          <input id="seed" type="number" step="1" min="0" className={field}
            value={Number.isNaN(params.seed) ? "" : params.seed} onChange={num("seed")} aria-invalid={!!errors.seed} />
        </Field>
        <Field id="opt" label="Optimization level (single run)">
          <select id="opt" className={field} value={params.optimization_level} onChange={(e) => set("optimization_level", Number(e.target.value))}>
            {[0, 1, 2, 3].map((l) => <option key={l} value={l}>Level {l}</option>)}
          </select>
        </Field>
      </div>
      <button onClick={onRun} disabled={loading || Object.keys(errors).length > 0}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-navy-950 transition disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        {loading ? "Running Aer simulation…" : "Run experiment"}
      </button>
    </section>
  );
}
