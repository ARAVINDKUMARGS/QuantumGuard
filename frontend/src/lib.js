export const LIMITS = { shotsMin: 100, shotsMax: 10000, noiseMin: 0, noiseMax: 0.05 };

export function validateParams({ shots, noise, seed }) {
  const errors = {};
  if (!Number.isInteger(shots) || shots < LIMITS.shotsMin || shots > LIMITS.shotsMax)
    errors.shots = `Shots must be an integer from ${LIMITS.shotsMin} to ${LIMITS.shotsMax}.`;
  if (typeof noise !== "number" || Number.isNaN(noise) || noise < LIMITS.noiseMin || noise > LIMITS.noiseMax)
    errors.noise = `Noise must be between ${LIMITS.noiseMin} and ${LIMITS.noiseMax}.`;
  if (!Number.isInteger(seed) || seed < 0) errors.seed = "Seed must be a non-negative integer.";
  return errors;
}

// Merge ideal/noisy distributions into Recharts rows, one row per bitstring.
export function toChartRows(ideal, noisy) {
  return Object.keys(ideal.probabilities).sort().map((state) => ({
    state,
    ideal: ideal.probabilities[state], noisy: noisy.probabilities[state],
    idealCount: ideal.counts[state], noisyCount: noisy.counts[state],
  }));
}

// True when every optimization level produced identical gate counts and depth.
export function levelsIdentical(levels) {
  const sig = (l) => JSON.stringify([l.metrics.depth, l.metrics.gate_counts]);
  return levels.every((l) => sig(l) === sig(levels[0]));
}

export const pct = (x) => `${(x * 100).toFixed(1)}%`;
