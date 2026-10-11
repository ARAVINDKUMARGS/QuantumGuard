# QuantumGuard

A local quantum-circuit reliability dashboard for Qiskit Fall Fest 2026. It runs Bell-state and single-qubit
superposition circuits on **Qiskit Aer** (a classical simulator — not real quantum hardware), compares ideal vs
noisy measurement distributions, reports total variation distance (TVD), and compares transpilation at
optimization levels 0–3.

```
React (Vite :5173) → Express (:4000) → FastAPI (:8000) → Qiskit + Aer
```

## Setup (Windows PowerShell)

Requires Python 3.10+ and Node 18+ (developed on Python 3.12, Node 22, Qiskit 2.5.2, Aer 0.17.2).

```powershell
# one-time setup (repo root)
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # if blocked: Set-ExecutionPolicy -Scope Process Bypass
pip install -r requirements.txt
npm run install:all
```

Run each service in its own PowerShell window (from the repo root):

```powershell
# Window 1 — quantum engine
.\.venv\Scripts\Activate.ps1; cd quantum-engine; python -m uvicorn app:app --port 8000
# Window 2 — Express API
cd backend; npm start
# Window 3 — frontend
cd frontend; npm run dev
```

Verify:

```powershell
curl.exe http://localhost:8000/health
curl.exe http://localhost:4000/api/health
npm run smoke                                  # live end-to-end check (needs windows 1 and 2)
cd quantum-engine; python -m pytest -v; cd ..  # Python tests
npm run test:backend; npm run test:frontend; npm run build
```

Open http://localhost:5173. Linux/macOS: use `source .venv/bin/activate` instead.

## API

**Express** (`/api`) — bodies are validated; defaults: circuit `bell`, shots 1024, noise 0.01, seed 42, level 1.

| Endpoint | Description |
|---|---|
| `GET /api/health` | Backend + engine status (503 `degraded` if engine is down) |
| `POST /api/simulate` | Ideal and noisy run, TVD, gate counts/depth, settings |
| `POST /api/optimize` | Transpile at levels 0–3; metrics + noisy run + TVD per level |

Request: `{ "circuit": "bell"|"superposition", "shots": 100-10000, "noise": 0-0.05, "seed": int, "optimization_level": 0-3 }`

Errors: `400` validation (or malformed JSON), `502` engine error, `503` engine unreachable, `504` timeout (default 30 s).
**FastAPI** exposes `GET /health`, `POST /simulate`, and `POST /optimize` (interactive docs at `:8000/docs`).

## Methodology

- **Ideal run:** `AerSimulator()` on the logical circuit. **Noisy run:** circuit transpiled to basis gates
  `[cx, id, rz, sx, x]` (no coupling map), executed on `AerSimulator(noise_model=…)`.
- **Noise model (strength p):** depolarizing error p on `sx`/`x`; depolarizing error min(2p, 1) on `cx`; symmetric readout
  error p (P(0→1) = P(1→0) = p). `rz` and `id` are error-free. This is a simple illustrative model, not a calibrated device.
- **TVD** = 0.5 · Σ |p_ideal(x) − p_noisy(x)| over all bitstrings (zero-count outcomes included).
- **Determinism:** `seed_simulator` and `seed_transpiler` are set to the request seed. Ideal and noisy runs share a seed,
  so at p = 0 they give identical counts and TVD is exactly 0.
- **Optimization comparison:** same circuit, basis gates, seeds at every level.
- **Reproducible output:** `cd quantum-engine; python run_experiment.py --circuit bell --shots 4000 --seed 42`
  writes `experiments/bell-sweep-seed42.json` (format in `docs/experiment-format.md`).

## Observed results (Bell, 4000 shots, seed 42, Qiskit 2.5.2 / Aer 0.17.2)

| p | 0 | 0.01 | 0.02 | 0.03 | 0.04 | 0.05 |
|---|---|---|---|---|---|---|
| TVD | 0.0000 | 0.0280 | 0.0560 | 0.0792 | 0.1070 | 0.1335 |

Other observations from these runs:

- All four optimization levels returned identical compiled circuits for both circuits (Bell: `rz×2, sx×1, cx×1`, depth 5),
  so TVD differences between levels are sampling variation, not an optimization effect. These circuits are too small to benefit.
- The single-qubit superposition circuit showed almost no TVD change (0.0052 at p = 0.05, 4000 shots): a uniform ideal
  distribution under symmetric noise stays near uniform, so that value is mostly sampling noise.

## Tests actually executed (this build)

| Suite | Command | Result |
|---|---|---|
| Python engine (pytest) | `python -m pytest` in `quantum-engine` | 16 passed |
| Express (node:test) | `npm run test:backend` | 5 passed |
| Frontend helpers (vitest) | `npm run test:frontend` | 6 passed |
| Frontend build | `npm run build` | succeeded (bundle-size warning only) |
| Live smoke test | `npm run smoke` | 4/4 checks passed |

Python tests cover: counts sum to shots, probabilities normalize, ideal Bell has zero 01/10 and ≈50/50 00/11 within 5σ,
noisy run executes and produces 01/10 outcomes, TVD formula and recomputation, seed determinism, real gate metrics, four
optimization levels, and input validation. Express tests use a stub upstream **only** for error paths (unreachable / 500 / timeout).

## Limitations

- Local simulation only; no cloud or hardware access. Circuits are 1–2 qubits.
- Illustrative depolarizing/readout noise; no T1/T2, crosstalk, or device calibration data.
- No coupling map, so routing effects are not exercised; optimization levels are indistinguishable for these circuits.
- Single seed per run: for small differences, repeat across seeds before drawing conclusions.
- The UI was built and its helpers/build tested, but visual layout was not checked in a browser during development —
  use `docs/screenshots-checklist.md` when you review it.

## Layout

`quantum-engine/` (app, circuits, experiments, schemas, tests) · `backend/` (Express routes, services, tests, smoke script) ·
`frontend/` (Vite app) · `experiments/` (generated sweeps) · `docs/`.
