import { Info } from "lucide-react";
import { levelsIdentical } from "../lib.js";

export default function OptimizationTable({ opt }) {
  const same = levelsIdentical(opt.levels);
  const best = Math.min(...opt.levels.map((l) => l.total_variation_distance));
  return (
    <section aria-label="Transpilation comparison" className="rounded-xl border border-navy-700 bg-navy-800 p-4">
      <h2 className="mb-1 text-sm font-semibold text-white">Transpilation comparison</h2>
      <p className="mb-3 text-xs text-slate-500">Target: basis gates {opt.settings.basis_gates.join(", ")}; all-to-all connectivity; seeded transpiler.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr><th className="py-2 pr-3">Level</th><th className="pr-3">Depth</th><th className="pr-3">Total gates</th><th className="pr-3">2-qubit</th><th className="pr-3">Gate counts</th><th>TVD (noisy)</th></tr>
          </thead>
          <tbody className="font-mono">
            {opt.levels.map((l) => (
              <tr key={l.optimization_level} className="border-t border-navy-700">
                <td className="py-2 pr-3 text-cyan-300">{l.optimization_level}</td>
                <td className="pr-3">{l.metrics.depth}</td>
                <td className="pr-3">{l.metrics.size}</td>
                <td className="pr-3">{l.metrics.two_qubit_gates}</td>
                <td className="pr-3 text-xs text-slate-300">{Object.entries(l.metrics.gate_counts).map(([g, n]) => `${g}×${n}`).join(" ")}</td>
                <td className={l.total_variation_distance === best ? "text-emerald-300" : ""}>{l.total_variation_distance.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex gap-2 text-xs text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden />
        <span>
          {same ? "All four levels produced identical gate counts and depth for this circuit; it is too small for the optimizer to improve. " : "Levels differ in structure for this circuit. "}
          TVD differences between levels reflect sampling variation unless the compiled circuits differ. Higher levels are not guaranteed to improve every metric.
        </span>
      </p>
    </section>
  );
}
