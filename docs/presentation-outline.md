# QuantumGuard — six-slide outline (Qiskit Fall Fest 2026)

1. **Problem** — Noise limits what quantum circuits can reliably do; how do we quantify it quickly?
2. **Solution & architecture** — React → Express → FastAPI → Qiskit Aer; one local, reproducible pipeline.
3. **Method** — Bell and superposition circuits; Aer noise model (depolarizing + readout); TVD = ½ Σ|p−q|; seeds recorded.
4. **Results (use your own run or `experiments/*.json`)** — TVD vs noise p for Bell (see README table); superposition is almost insensitive to this symmetric noise.
5. **Transpilation** — Levels 0–3 against one basis-gate target; for these tiny circuits all levels were identical — higher levels are not always better.
6. **Limitations & next steps** — Simulator only, small circuits, simple noise model; next: larger circuits, device-calibrated noise, coupling maps.
