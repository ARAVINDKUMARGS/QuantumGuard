import { pct } from "../lib.js";

function Card({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function MetricCards({ sim }) {
  const t = sim.circuit_info.transpiled;
  const l = sim.circuit_info.logical;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card label="Total variation distance" value={sim.total_variation_distance.toFixed(4)} sub={`≈ ${pct(sim.total_variation_distance)} probability mass shifted`} accent="text-cyan-300" />
      <Card label="Shots" value={sim.noisy.shots.toLocaleString()} sub={`noise p = ${sim.settings.noise_strength}`} accent="text-white" />
      <Card label="Depth (logical → basis)" value={`${l.depth} → ${t.depth}`} sub={`level ${sim.circuit_info.optimization_level}`} accent="text-violet-300" />
      <Card label="Gates (logical → basis)" value={`${l.size} → ${t.size}`} sub={`${t.two_qubit_gates} two-qubit`} accent="text-violet-300" />
    </div>
  );
}
