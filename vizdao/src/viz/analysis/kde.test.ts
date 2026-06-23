// src/viz/analysis/kde.test.ts
import { describe, it, expect } from 'vitest';
import { histogram, gaussianKDE } from './kde';

describe('histogram', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('returns exactly binCount bins', () => {
    const bins = histogram(values, 5);
    expect(bins.length).toBe(5);
  });

  it('counts sum to values.length', () => {
    const bins = histogram(values, 5);
    const total = bins.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(values.length);
  });

  it('spans [min, max] with equal-width bins', () => {
    const bins = histogram(values, 5);
    expect(bins[0].x0).toBeCloseTo(1, 9);
    expect(bins[bins.length - 1].x1).toBeCloseTo(10, 9);
    const widths = bins.map((b) => b.x1 - b.x0);
    widths.forEach((w) => expect(w).toBeCloseTo(widths[0], 9));
  });

  it('counts sum to n with non-uniform data', () => {
    const skewed = [0, 0, 0, 1, 5, 5, 10];
    const bins = histogram(skewed, 4);
    const total = bins.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(skewed.length);
  });

  it('returns 1 bin when binCount=1', () => {
    const bins = histogram(values, 1);
    expect(bins.length).toBe(1);
    expect(bins[0].count).toBe(values.length);
  });
});

describe('gaussianKDE', () => {
  const values = Array.from({ length: 50 }, (_, i) => i / 49); // uniform [0,1]

  it('returns gridPoints points by default', () => {
    const pts = gaussianKDE(values, 0.1);
    expect(pts.length).toBe(120);
  });

  it('returns custom gridPoints count', () => {
    const pts = gaussianKDE(values, 0.1, 60);
    expect(pts.length).toBe(60);
  });

  it('all densities are non-negative', () => {
    const pts = gaussianKDE(values, 0.2);
    pts.forEach((p) => expect(p.density).toBeGreaterThanOrEqual(0));
  });

  it('numeric integral ≈ 1 within 0.05 tolerance', () => {
    const pts = gaussianKDE(values, 0.1);
    const dx = pts[1].x - pts[0].x;
    const integral = pts.reduce((s, p) => s + p.density * dx, 0);
    expect(Math.abs(integral - 1)).toBeLessThan(0.05);
  });

  it('integral ≈ 1 for a normal-ish sample with moderate bandwidth', () => {
    // use a sample that is more like real data
    const sample = [-1, -0.5, 0, 0.5, 1, -0.3, 0.3, -0.7, 0.7, 0];
    const pts = gaussianKDE(sample, 0.4);
    const dx = pts[1].x - pts[0].x;
    const integral = pts.reduce((s, p) => s + p.density * dx, 0);
    expect(Math.abs(integral - 1)).toBeLessThan(0.05);
  });
});
