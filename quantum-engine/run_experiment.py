"""Reproducible noise sweep. Writes experiments/<circuit>-sweep-seed<seed>.json.

Usage: python run_experiment.py --circuit bell --shots 4000 --seed 42
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import experiments
from schemas import OptimizeRequest

p = argparse.ArgumentParser()
p.add_argument("--circuit", default="bell", choices=["bell", "superposition"])
p.add_argument("--shots", type=int, default=4000)
p.add_argument("--seed", type=int, default=42)
p.add_argument("--noise", type=float, nargs="+", default=[0.0, 0.01, 0.02, 0.03, 0.04, 0.05])
a = p.parse_args()

runs = []
for noise in a.noise:
    req = OptimizeRequest(circuit=a.circuit, shots=a.shots, noise=noise, seed=a.seed)
    out = experiments.run_simulation(req)
    runs.append({"noise": noise, "tvd": out["total_variation_distance"],
                 "ideal_counts": out["ideal"]["counts"], "noisy_counts": out["noisy"]["counts"],
                 "transpiled": out["circuit_info"]["transpiled"]})
doc = {"schema": "quantumguard.sweep/1", "generated_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
       "circuit": a.circuit, "shots": a.shots, "seed": a.seed, "settings": out["settings"], "runs": runs}
path = Path(__file__).resolve().parent.parent / "experiments" / f"{a.circuit}-sweep-seed{a.seed}.json"
path.parent.mkdir(exist_ok=True)
path.write_text(json.dumps(doc, indent=2))
print(f"wrote {path}")
for r in runs:
    print(f"p={r['noise']:.3f}  TVD={r['tvd']:.4f}  noisy={r['noisy_counts']}")
