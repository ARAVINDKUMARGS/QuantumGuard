import { AlertTriangle, FlaskConical, Loader2 } from "lucide-react";

export const EmptyState = () => (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-navy-600 bg-navy-900 px-6 py-16 text-center">
    <FlaskConical className="mb-3 h-10 w-10 text-cyan-300" aria-hidden />
    <h2 className="text-base font-semibold text-white">No experiment yet</h2>
    <p className="mt-1 max-w-md text-sm text-slate-400">Choose a circuit, shots and noise strength, then run an experiment to compare ideal and noisy Aer simulations.</p>
  </div>
);

export const LoadingState = () => (
  <div role="status" className="flex items-center justify-center gap-3 rounded-xl border border-navy-700 bg-navy-900 py-16 text-slate-300">
    <Loader2 className="h-5 w-5 animate-spin text-cyan-300" aria-hidden /> Running ideal and noisy simulations and transpiling at levels 0–3…
  </div>
);

export const ErrorBanner = ({ error }) => (
  <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
    <div>
      <p className="font-semibold">{error.message}</p>
      {error.details && <p className="mt-1 text-rose-200/80">{typeof error.details === "string" ? error.details : JSON.stringify(error.details)}</p>}
    </div>
  </div>
);
