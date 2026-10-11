# Experiment output format

`python quantum-engine/run_experiment.py` writes `experiments/<circuit>-sweep-seed<seed>.json`
(schema `quantumguard.sweep/1`). The dashboard's **Export JSON** button writes `{ sim, opt, params, ranAt }`
where `sim` is the `POST /api/simulate` response and `opt` the `POST /api/optimize` response.

```jsonc
{
  "schema": "quantumguard.sweep/1",
  "generated_utc": "2026-10-11T12:00:00+00:00",
  "circuit": "bell", "shots": 4000, "seed": 42,
  "settings": { "qiskit_version": "...", "qiskit_aer_version": "...", "basis_gates": [...], "noise_model": {...} },
  "runs": [ { "noise": 0.02, "tvd": 0.056, "ideal_counts": {...}, "noisy_counts": {...}, "transpiled": {...} } ]
}
```

To reproduce: same Qiskit/Aer versions + same `--circuit --shots --seed --noise` arguments give identical counts.
