// src/viz/analysis/kde.ts — pure TS, no deps.
// Exports: histogram, gaussianKDE.

export interface Bin {
  x0: number;
  x1: number;
  count: number;
}

export interface KDEPoint {
  x: number;
  density: number;
}

/**
 * Equal-width histogram spanning [min, max].
 * Counts sum to values.length.
 */
export function histogram(values: number[], binCount: number): Bin[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / binCount;

  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    count: 0,
  }));

  for (const v of values) {
    // Clamp the last value into the last bin (v === max edge case)
    const idx = Math.min(Math.floor((v - min) / width), binCount - 1);
    bins[idx].count += 1;
  }

  return bins;
}

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/**
 * Gaussian kernel density estimate on a uniform grid.
 * Grid spans a bit beyond [min, max] so the tails show up.
 * density(x) = (1/(n·h·√(2π))) · Σ exp(-((x-xi)/h)²/2)
 */
export function gaussianKDE(
  values: number[],
  bandwidth: number,
  gridPoints: number = 120,
): KDEPoint[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = bandwidth * 3;
  const lo = min - padding;
  const hi = max + padding;

  const n = values.length;
  const result: KDEPoint[] = [];

  for (let i = 0; i < gridPoints; i++) {
    const x = lo + (i / (gridPoints - 1)) * (hi - lo);
    let sum = 0;
    for (const xi of values) {
      const z = (x - xi) / bandwidth;
      sum += Math.exp(-0.5 * z * z);
    }
    result.push({ x, density: sum / (n * bandwidth * SQRT_2PI) });
  }

  return result;
}
