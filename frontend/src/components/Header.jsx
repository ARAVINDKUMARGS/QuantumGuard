import { Atom, Cpu } from "lucide-react";

export default function Header({ health }) {
  const tone = { ok: "bg-emerald-400", down: "bg-rose-400", checking: "bg-amber-400" }[health.state];
  return (
    <header className="border-b border-navy-700 bg-navy-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Atom className="h-7 w-7 text-cyan-300" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">QuantumGuard</h1>
            <p className="text-xs text-slate-400">Quantum circuit reliability dashboard</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-violet-200">
            <Cpu className="h-3.5 w-3.5" aria-hidden /> Simulator: Qiskit Aer (local, not real hardware)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-600 px-3 py-1 text-slate-300" role="status">
            <span className={`h-2 w-2 rounded-full ${tone}`} aria-hidden />
            {health.state === "ok" ? `Engine online · Aer ${health.aer}` : health.state === "down" ? "Backend or engine offline" : "Checking services…"}
          </span>
        </div>
      </div>
    </header>
  );
}
