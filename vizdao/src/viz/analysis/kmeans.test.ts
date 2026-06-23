// src/viz/analysis/kmeans.test.ts
import { describe, it, expect } from 'vitest';
import { kmeans } from './kmeans';

describe('kmeans', () => {
  // Two well-separated blobs: 5 points near (0,0) and 5 points near (10,10)
  const blob0 = [[0.1, 0.2], [0.3, 0.1], [0.0, 0.3], [0.2, 0.0], [0.1, 0.1]];
  const blob1 = [[9.9, 9.8], [10.1, 9.9], [10.0, 10.2], [9.8, 10.1], [10.2, 10.0]];
  const points = [...blob0, ...blob1]; // indices 0-4 = blob0, 5-9 = blob1

  it('splits two well-separated blobs into 2 distinct labels', () => {
    const { assignments, centroids } = kmeans(points, 2, { seed: 42 });

    // Both clusters should be non-empty
    const labels = new Set(assignments);
    expect(labels.size).toBe(2);

    // All blob0 points should share a label, all blob1 points should share a label
    const blob0Label = assignments[0];
    const blob1Label = assignments[5];
    expect(blob0Label).not.toBe(blob1Label);

    for (let i = 1; i < 5; i++) expect(assignments[i]).toBe(blob0Label);
    for (let i = 6; i < 10; i++) expect(assignments[i]).toBe(blob1Label);

    // Centroids should be near the blob centers
    const c0 = centroids[blob0Label];
    const c1 = centroids[blob1Label];
    expect(c0[0]).toBeCloseTo(0.14, 0);
    expect(c0[1]).toBeCloseTo(0.14, 0);
    expect(c1[0]).toBeCloseTo(10.0, 0);
    expect(c1[1]).toBeCloseTo(10.0, 0);
  });

  it('is deterministic — same seed → identical assignments', () => {
    const r1 = kmeans(points, 2, { seed: 7 });
    const r2 = kmeans(points, 2, { seed: 7 });
    expect(r1.assignments).toEqual(r2.assignments);
    r1.centroids.forEach((c, i) => {
      c.forEach((v, j) => expect(v).toBeCloseTo(r2.centroids[i][j], 10));
    });
  });

  it('different seeds may differ', () => {
    const r1 = kmeans(points, 2, { seed: 1 });
    const r2 = kmeans(points, 2, { seed: 999 });
    // Both should converge to the same partition (two blobs), but label assignment
    // may differ. The important check: still 2 labels.
    expect(new Set(r1.assignments).size).toBe(2);
    expect(new Set(r2.assignments).size).toBe(2);
  });

  it('assignments.length === points.length', () => {
    const { assignments } = kmeans(points, 2, { seed: 42 });
    expect(assignments.length).toBe(points.length);
  });

  it('centroids.length === k', () => {
    const { centroids } = kmeans(points, 2, { seed: 42 });
    expect(centroids.length).toBe(2);
  });

  it('works on Iris-like 2-D data with k=3', () => {
    // Generate 30 points in 3 separated clusters
    const cluster = (cx: number, cy: number, n: number) =>
      Array.from({ length: n }, (_, i) => [cx + (i % 5) * 0.05, cy + Math.floor(i / 5) * 0.05]);
    const pts = [...cluster(1, 1, 10), ...cluster(4, 4, 10), ...cluster(8, 1, 10)];
    const { assignments, centroids, iterations } = kmeans(pts, 3, { seed: 42 });
    expect(assignments.length).toBe(30);
    expect(centroids.length).toBe(3);
    expect(iterations).toBeGreaterThan(0);
    expect(new Set(assignments).size).toBe(3);
  });
});
