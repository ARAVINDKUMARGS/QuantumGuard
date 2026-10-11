import { describe, expect, it } from "vitest";
import { levelsIdentical, toChartRows, validateParams } from "./lib.js";

describe("validateParams", () => {
  it("accepts valid input", () => expect(validateParams({ shots: 1024, noise: 0.01, seed: 1 })).toEqual({}));
  it("rejects out-of-range shots and noise", () => {
    const e = validateParams({ shots: 50, noise: 0.2, seed: 1 });
    expect(e.shots).toBeDefined();
    expect(e.noise).toBeDefined();
  });
  it("rejects NaN and fractional values", () => {
    expect(validateParams({ shots: 100.5, noise: NaN, seed: -1 })).toHaveProperty("shots");
  });
});

describe("toChartRows", () => {
  it("builds a row per bitstring", () => {
    const ideal = { probabilities: { "00": 0.5, "11": 0.5 }, counts: { "00": 5, "11": 5 } };
    const noisy = { probabilities: { "00": 0.4, "11": 0.6 }, counts: { "00": 4, "11": 6 } };
    expect(toChartRows(ideal, noisy)).toEqual([
      { state: "00", ideal: 0.5, noisy: 0.4, idealCount: 5, noisyCount: 4 },
      { state: "11", ideal: 0.5, noisy: 0.6, idealCount: 5, noisyCount: 6 },
    ]);
  });
});

describe("levelsIdentical", () => {
  const mk = (d, g) => ({ metrics: { depth: d, gate_counts: g } });
  it("detects identical levels", () => expect(levelsIdentical([mk(5, { cx: 1 }), mk(5, { cx: 1 })])).toBe(true));
  it("detects differing levels", () => expect(levelsIdentical([mk(5, { cx: 1 }), mk(4, { cx: 1 })])).toBe(false));
});
