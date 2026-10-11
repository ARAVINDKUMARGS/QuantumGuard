export default function CircuitPanel({ info }) {
  const rows = (m) => Object.entries(m.gate_counts).map(([g, n]) => `${g}×${n}`).join("  ") || "—";
  return (
    <section aria-label="Circuit details" className="rounded-xl border border-navy-700 bg-navy-800 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Circuit</h2>
      <pre className="overflow-x-auto rounded-md bg-navy-950 p-3 font-mono text-xs leading-tight text-cyan-200">{info.diagram}</pre>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div><dt className="text-slate-500">Logical gates (depth {info.logical.depth})</dt><dd className="font-mono text-slate-200">{rows(info.logical)}</dd></div>
        <div><dt className="text-slate-500">Basis gates, level {info.optimization_level} (depth {info.transpiled.depth})</dt><dd className="font-mono text-slate-200">{rows(info.transpiled)}</dd></div>
      </dl>
    </section>
  );
}
