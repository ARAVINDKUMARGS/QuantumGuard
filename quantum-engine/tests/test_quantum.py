import math
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app as engine  # noqa: E402
from experiments import total_variation_distance  # noqa: E402

client = TestClient(engine.app)


def sim(**kw):
    body = {"circuit": "bell", "shots": 4000, "noise": 0.0, "seed": 7, "optimization_level": 1}
    body.update(kw)
    r = client.post("/simulate", json=body)
    assert r.status_code == 200, r.text
    return r.json()


def test_health():
    assert client.get("/health").json()["status"] == "ok"


@pytest.mark.parametrize("circuit,nbits", [("bell", 4), ("superposition", 2)])
def test_counts_sum_and_probabilities_normalize(circuit, nbits):
    d = sim(circuit=circuit, shots=1234, noise=0.03)
    for key in ("ideal", "noisy"):
        assert sum(d[key]["counts"].values()) == 1234
        assert math.isclose(sum(d[key]["probabilities"].values()), 1.0, abs_tol=1e-9)
        assert len(d[key]["counts"]) == nbits


def test_ideal_bell_is_00_11_within_sampling_uncertainty():
    shots = 4000
    d = sim(shots=shots)
    c = d["ideal"]["counts"]
    assert c["01"] == 0 and c["10"] == 0
    sigma = math.sqrt(shots * 0.25)
    assert abs(c["00"] - shots / 2) < 5 * sigma
    assert abs(c["11"] - shots / 2) < 5 * sigma


def test_noisy_simulation_runs_and_adds_error_states():
    d = sim(noise=0.05)
    assert sum(d["noisy"]["counts"].values()) == 4000
    assert d["noisy"]["counts"]["01"] + d["noisy"]["counts"]["10"] > 0
    assert d["total_variation_distance"] > 0.0


def test_tvd_formula():
    assert total_variation_distance({"0": 0.5, "1": 0.5}, {"0": 0.25, "1": 0.75}) == pytest.approx(0.25)
    assert total_variation_distance({"00": 1.0}, {"11": 1.0}) == pytest.approx(1.0)
    p = {"00": 0.5, "11": 0.5}
    assert total_variation_distance(p, p) == 0.0


def test_reported_tvd_matches_recomputation():
    d = sim(noise=0.04)
    t = total_variation_distance(d["ideal"]["probabilities"], d["noisy"]["probabilities"])
    assert d["total_variation_distance"] == pytest.approx(t)


def test_deterministic_with_same_seed():
    assert sim(noise=0.03, seed=11)["noisy"]["counts"] == sim(noise=0.03, seed=11)["noisy"]["counts"]


def test_gate_metrics_are_real():
    d = sim()
    assert d["circuit_info"]["logical"]["gate_counts"] == {"h": 1, "cx": 1}
    assert d["circuit_info"]["logical"]["depth"] >= 2
    assert set(d["circuit_info"]["transpiled"]["gate_counts"]) <= {"cx", "id", "rz", "sx", "x"}
    assert d["circuit_info"]["transpiled"]["two_qubit_gates"] == 1


def test_optimize_returns_four_levels():
    r = client.post("/optimize", json={"circuit": "bell", "shots": 1000, "noise": 0.02, "seed": 3})
    assert r.status_code == 200
    levels = r.json()["levels"]
    assert [l["optimization_level"] for l in levels] == [0, 1, 2, 3]
    for l in levels:
        assert l["metrics"]["depth"] > 0 and sum(l["noisy"]["counts"].values()) == 1000


@pytest.mark.parametrize("body", [
    {"shots": 99}, {"shots": 10001}, {"noise": -0.1}, {"noise": 0.051},
    {"circuit": "ghz"}, {"optimization_level": 4}])
def test_validation_rejects_bad_input(body):
    assert client.post("/simulate", json=body).status_code == 422
