"""Circuit definitions. Every circuit measures all qubits into classical bits."""
from qiskit import QuantumCircuit

SUPPORTED = ("bell", "superposition")


def build_circuit(name: str) -> QuantumCircuit:
    if name == "bell":
        qc = QuantumCircuit(2, 2, name="bell")
        qc.h(0)
        qc.cx(0, 1)
        qc.measure([0, 1], [0, 1])
        return qc
    if name == "superposition":
        qc = QuantumCircuit(1, 1, name="superposition")
        qc.h(0)
        qc.measure(0, 0)
        return qc
    raise ValueError(f"Unknown circuit '{name}'. Supported: {', '.join(SUPPORTED)}")
