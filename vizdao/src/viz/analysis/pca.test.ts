// src/viz/analysis/pca.test.ts — TDD tests for PCA module (RED before implementation)
import { describe, it, expect } from 'vitest';
import { jacobiEigen, covariance, pca, project, mean } from './pca';
import { IRIS } from '../datasets/iris';

describe('jacobiEigen', () => {
  it('diagonal 2x2: eigenvalues = diagonal entries, eigenvectors axis-aligned', () => {
    const { values, vectors } = jacobiEigen([[2, 0], [0, 1]]);
    // sorted descending: values[0]=2, values[1]=1
    expect(values[0]).toBeCloseTo(2, 5);
    expect(values[1]).toBeCloseTo(1, 5);
    // eigenvector for value 2 should be ≈ [1,0] (up to sign)
    expect(Math.abs(vectors[0][0])).toBeCloseTo(1, 5);
    expect(Math.abs(vectors[0][1])).toBeCloseTo(0, 5);
    // eigenvector for value 1 should be ≈ [0,1] (up to sign)
    expect(Math.abs(vectors[1][0])).toBeCloseTo(0, 5);
    expect(Math.abs(vectors[1][1])).toBeCloseTo(1, 5);
  });

  it('symmetric 2x2 [[2,1],[1,2]]: eigenvalues ≈ [3,1], eigenvector for 3 ≈ ±[0.707,0.707]', () => {
    const { values, vectors } = jacobiEigen([[2, 1], [1, 2]]);
    expect(values[0]).toBeCloseTo(3, 5);
    expect(values[1]).toBeCloseTo(1, 5);
    // eigenvector for value 3 ≈ [1/√2, 1/√2] (up to sign)
    expect(Math.abs(vectors[0][0])).toBeCloseTo(1 / Math.sqrt(2), 4);
    expect(Math.abs(vectors[0][1])).toBeCloseTo(1 / Math.sqrt(2), 4);
  });

  it('eigenvalues sum equals trace', () => {
    const A = [[4, 2, 1], [2, 3, 0], [1, 0, 5]];
    const { values } = jacobiEigen(A);
    const trace = A[0][0] + A[1][1] + A[2][2];
    const sumEigenvalues = values.reduce((a, b) => a + b, 0);
    expect(sumEigenvalues).toBeCloseTo(trace, 5);
  });

  it('IRIS covariance eigenvalues sum ≈ trace of covariance', () => {
    const features = IRIS.map((s) => s.features as number[]);
    const cov = covariance(features);
    const trace = cov.reduce((acc, row, i) => acc + row[i], 0);
    const { values } = jacobiEigen(cov);
    expect(values.reduce((a, b) => a + b, 0)).toBeCloseTo(trace, 4);
  });
});

describe('pca', () => {
  it('pca(IRIS features): explained[0] is largest and > 0.7', () => {
    const features = IRIS.map((s) => s.features as number[]);
    const result = pca(features);
    // explained sorted descending
    for (let i = 0; i < result.explained.length - 1; i++) {
      expect(result.explained[i]).toBeGreaterThanOrEqual(result.explained[i + 1]);
    }
    expect(result.explained[0]).toBeGreaterThan(0.7);
  });

  it('pca(IRIS features): explained sums to ~1', () => {
    const features = IRIS.map((s) => s.features as number[]);
    const result = pca(features);
    const total = result.explained.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 4);
  });

  it('project returns IRIS.length points each of length 2', () => {
    const features = IRIS.map((s) => s.features as number[]);
    const model = pca(features);
    const projected = project(features, model, 0, 1);
    expect(projected).toHaveLength(features.length);
    projected.forEach((pt) => expect(pt).toHaveLength(2));
  });
});

describe('mean', () => {
  it('computes column means', () => {
    const data = [[1, 2], [3, 4], [5, 6]];
    const m = mean(data);
    expect(m[0]).toBeCloseTo(3, 5);
    expect(m[1]).toBeCloseTo(4, 5);
  });
});

describe('covariance', () => {
  it('2x2 known data', () => {
    // data: [[1,2],[3,4],[5,6]] — centered: [[-2,-2],[0,0],[2,2]]
    // cov = (1/(3-1)) * [[-2,0,2],[-2,0,2]] * [[-2,-2],[0,0],[2,2]] = [[4,4],[4,4]]
    const data = [[1, 2], [3, 4], [5, 6]];
    const cov = covariance(data);
    expect(cov[0][0]).toBeCloseTo(4, 5);
    expect(cov[0][1]).toBeCloseTo(4, 5);
    expect(cov[1][0]).toBeCloseTo(4, 5);
    expect(cov[1][1]).toBeCloseTo(4, 5);
  });
});
