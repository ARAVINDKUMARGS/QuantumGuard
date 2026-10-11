import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getHealth, optimize, simulate } from "./api.js";
import CircuitPanel from "./components/CircuitPanel.jsx";
import ControlPanel from "./components/ControlPanel.jsx";
import Header from "./components/Header.jsx";
import Histogram from "./components/Histogram.jsx";
import MetricCards from "./components/MetricCards.jsx";
import OptimizationTable from "./components/OptimizationTable.jsx";
import { EmptyState, ErrorBanner, LoadingState } from "./components/States.jsx";
import { toChartRows, validateParams } from "./lib.js";

const DEFAULTS = { circuit: "bell", shots: 1024, noise: 0.02, seed: 42, optimization_level: 1 };

export default function App() {
  const [params, setParams] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState({ state: "checking" });
  const errors = validateParams(params);

  const checkHealth = useCallback(async () => {
    try { const h = await getHealth(); setHealth({ state: "ok", aer: h.engine.qiskit_aer }); }
    catch { setHealth({ state: "down" }); }
  }, []);
  useEffect(() => { checkHealth(); const t = setInterval(checkHealth, 15000); return () => clearInterval(t); }, [checkHealth]);

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const [sim, opt] = await Promise.all([simulate(params), optimize(params)]);
      setResult({ sim, opt, params, ranAt: new Date().toISOString() });
    } catch (e) { setError(e); setResult(null); }
    finally { setLoading(false); checkHealth(); }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `quantumguard-${result.params.circuit}-seed${result.params.seed}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const rows = result && toChartRows(result.sim.ideal, result.sim.noisy);
  return (
    <div className="min-h-screen">
      <Header health={health} />
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[18rem_1fr]">
        <ControlPanel params={params} setParams={setParams} errors={errors} onRun={run} loading={loading} />
        <div className="min-w-0 space-y-5">
          {error && <ErrorBanner error={error} />}
          {loading ? <LoadingState /> : !result ? (!error && <EmptyState />) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Results from Qiskit {result.sim.settings.qiskit_version} / Aer {result.sim.settings.qiskit_aer_version} · seed {result.params.seed}</p>
                <button onClick={exportJson} className="inline-flex items-center gap-1.5 rounded-md border border-navy-600 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400">
                  <Download className="h-3.5 w-3.5" aria-hidden /> Export JSON
                </button>
              </div>
              <MetricCards sim={result.sim} />
              <div className="grid gap-5 md:grid-cols-2">
                <Histogram title="Ideal simulation" field="ideal" rows={rows} color="#22d3ee" shots={result.sim.ideal.shots} />
                <Histogram title="Noisy simulation" field="noisy" rows={rows} color="#a78bfa" shots={result.sim.noisy.shots} />
              </div>
              <CircuitPanel info={result.sim.circuit_info} />
              <OptimizationTable opt={result.opt} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
