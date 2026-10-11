"""Ideal vs noisy Aer experiments, TVD and transpilation comparison."""
from itertools import product
from typing import Dict

import qiskit
import qiskit_aer
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, ReadoutError, depolarizing_error

from circuits import build_circuit

# Consistent transpilation target for every experiment: a fixed basis gate set,
# all-to-all connectivity (no coupling map). Noise is attached to these gates.
BASIS_GATES = ["cx", "id", "rz", "sx", "x"]
ONE_QUBIT_NOISY = ["sx", "x"]  # rz is virtual (error-free), id kept error-free
TWO_QUBIT_NOISY = ["cx"]
IGNORED_OPS = {"measure", "barrier"}


def build_noise_model(p: float) -> NoiseModel:
    """Depolarizing error p on 1q gates, min(2p, 1) on cx, symmetric readout error p."""
    nm = NoiseModel(basis_gates=BASIS_GATES)
    if p > 0:
        nm.add_all_qubit_quantum_error(depolarizing_error(p, 1), ONE_QUBIT_NOISY)
        nm.add_all_qubit_quantum_error(depolarizing_error(min(2 * p, 1.0), 2), TWO_QUBIT_NOISY)
        nm.add_all_qubit_readout_error(ReadoutError([[1 - p, p], [p, 1 - p]]))
    return nm


def circuit_metrics(qc: QuantumCircuit) -> Dict[str, object]:
    ops = {k: int(v) for k, v in qc.count_ops().items() if k not in IGNORED_OPS}
    two_q = sum(1 for inst in qc.data
                if inst.operation.name not in IGNORED_OPS and len(inst.qubits) == 2)
    return {"depth": int(qc.depth()), "size": int(sum(ops.values())),
            "two_qubit_gates": int(two_q), "gate_counts": ops}


def _distribution(counts: Dict[str, int], shots: int, num_clbits: int) -> Dict[str, object]:
    full = {"".join(b): 0 for b in product("01", repeat=num_clbits)}
    for k, v in counts.items():
        full[k.replace(" ", "")] = int(v)
    total = sum(full.values())
    assert total == shots, f"counts sum {total} != shots {shots}"
    return {"shots": shots, "counts": full,
            "probabilities": {k: v / shots for k, v in full.items()}}


def total_variation_distance(p: Dict[str, float], q: Dict[str, float]) -> float:
    """TVD = 0.5 * sum_x |p(x) - q(x)| over all bitstrings."""
    keys = set(p) | set(q)
    return 0.5 * sum(abs(p.get(k, 0.0) - q.get(k, 0.0)) for k in keys)


def _run(qc: QuantumCircuit, backend: AerSimulator, shots: int, seed: int) -> Dict[str, int]:
    return backend.run(qc, shots=shots, seed_simulator=seed).result().get_counts()


def _noisy_run(circuit: str, level: int, shots: int, noise: float, seed: int):
    qc = build_circuit(circuit)
    noisy_backend = AerSimulator(noise_model=build_noise_model(noise), basis_gates=BASIS_GATES)
    tqc = transpile(qc, basis_gates=BASIS_GATES, optimization_level=level, seed_transpiler=seed)
    counts = _run(tqc, noisy_backend, shots, seed)
    return qc, tqc, _distribution(counts, shots, qc.num_clbits)


def settings(req) -> Dict[str, object]:
    return {
        "simulator": "qiskit_aer.AerSimulator (local, CPU, statevector/density auto-select)",
        "qiskit_version": qiskit.__version__, "qiskit_aer_version": qiskit_aer.__version__,
        "shots": req.shots, "noise_strength": req.noise, "seed": req.seed,
        "seed_simulator": req.seed, "seed_transpiler": req.seed,
        "basis_gates": BASIS_GATES, "coupling_map": None,
        "noise_model": {
            "one_qubit_depolarizing": {"gates": ONE_QUBIT_NOISY, "p": req.noise},
            "two_qubit_depolarizing": {"gates": TWO_QUBIT_NOISY, "p": min(2 * req.noise, 1.0)},
            "readout_error": {"p01": req.noise, "p10": req.noise},
        },
    }


def run_simulation(req) -> Dict[str, object]:
    qc = build_circuit(req.circuit)
    ideal_counts = _run(qc, AerSimulator(), req.shots, req.seed)
    ideal = _distribution(ideal_counts, req.shots, qc.num_clbits)
    _, tqc, noisy = _noisy_run(req.circuit, req.optimization_level, req.shots, req.noise, req.seed)
    tvd = total_variation_distance(ideal["probabilities"], noisy["probabilities"])
    return {
        "circuit": req.circuit, "ideal": ideal, "noisy": noisy,
        "total_variation_distance": tvd,
        "circuit_info": {"logical": circuit_metrics(qc), "transpiled": circuit_metrics(tqc),
                         "optimization_level": req.optimization_level,
                         "diagram": str(qc.draw(output="text"))},
        "settings": settings(req),
    }


def run_optimization(req) -> Dict[str, object]:
    qc = build_circuit(req.circuit)
    ideal = _distribution(_run(qc, AerSimulator(), req.shots, req.seed), req.shots, qc.num_clbits)
    levels = []
    for level in range(4):
        _, tqc, noisy = _noisy_run(req.circuit, level, req.shots, req.noise, req.seed)
        levels.append({"optimization_level": level, "metrics": circuit_metrics(tqc),
                       "noisy": noisy,
                       "total_variation_distance": total_variation_distance(
                           ideal["probabilities"], noisy["probabilities"])})
    return {"circuit": req.circuit, "logical": circuit_metrics(qc), "levels": levels,
            "settings": settings(req),
            "note": "Same circuit, basis gates, and seeds at every level. Higher levels are not "
                    "guaranteed to improve every metric; TVD differences also include sampling noise."}
