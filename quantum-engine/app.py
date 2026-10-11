"""FastAPI quantum engine. Run: uvicorn app:app --port 8000"""
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import experiments
from schemas import OptimizeRequest, OptimizeResponse, SimulateRequest, SimulateResponse

log = logging.getLogger("quantum-engine")
app = FastAPI(title="QuantumGuard Quantum Engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:4000"],
                   allow_methods=["GET", "POST"], allow_headers=["*"])


@app.get("/health")
def health():
    import qiskit, qiskit_aer
    return {"status": "ok", "service": "quantum-engine", "qiskit": qiskit.__version__,
            "qiskit_aer": qiskit_aer.__version__}


@app.post("/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    try:
        return experiments.run_simulation(req)
    except Exception as exc:  # surface as 500 with message, never fake results
        log.exception("simulation failed")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {exc}")


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(req: OptimizeRequest):
    try:
        return experiments.run_optimization(req)
    except Exception as exc:
        log.exception("optimization failed")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {exc}")
