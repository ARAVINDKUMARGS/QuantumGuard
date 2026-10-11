"""Validated request/response schemas for the QuantumGuard engine."""
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

CircuitName = Literal["bell", "superposition"]


class SimulateRequest(BaseModel):
    circuit: CircuitName = "bell"
    shots: int = Field(1024, ge=100, le=10000)
    noise: float = Field(0.01, ge=0.0, le=0.05, description="Noise strength p")
    seed: int = Field(42, ge=0, le=2**31 - 1)
    optimization_level: int = Field(1, ge=0, le=3)


class OptimizeRequest(SimulateRequest):
    pass


class Distribution(BaseModel):
    shots: int
    counts: Dict[str, int]
    probabilities: Dict[str, float]


class CircuitMetrics(BaseModel):
    depth: int
    size: int
    two_qubit_gates: int
    gate_counts: Dict[str, int]


class CircuitInfo(BaseModel):
    logical: CircuitMetrics
    transpiled: CircuitMetrics
    optimization_level: int
    diagram: str


class SimulateResponse(BaseModel):
    circuit: str
    ideal: Distribution
    noisy: Distribution
    total_variation_distance: float
    circuit_info: CircuitInfo
    settings: Dict[str, object]


class LevelResult(BaseModel):
    optimization_level: int
    metrics: CircuitMetrics
    noisy: Distribution
    total_variation_distance: float


class OptimizeResponse(BaseModel):
    circuit: str
    logical: CircuitMetrics
    levels: List[LevelResult]
    settings: Dict[str, object]
    note: Optional[str] = None
