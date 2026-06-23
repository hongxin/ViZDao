// src/viz/analysis/pca.ts — Pure-TS PCA via Jacobi eigenvalue algorithm. Zero deps.

/** Compute column-wise mean of row-data (n × d). */
export function mean(data: number[][]): number[] {
  const n = data.length;
  const d = data[0].length;
  const m = new Array<number>(d).fill(0);
  for (const row of data) {
    for (let j = 0; j < d; j++) m[j] += row[j];
  }
  for (let j = 0; j < d; j++) m[j] /= n;
  return m;
}

/** d×d sample covariance matrix, divide by (n-1). */
export function covariance(data: number[][]): number[][] {
  const n = data.length;
  const d = data[0].length;
  const mu = mean(data);
  // Initialize d×d matrix
  const cov: number[][] = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  for (const row of data) {
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        cov[i][j] += (row[i] - mu[i]) * (row[j] - mu[j]);
      }
    }
  }
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      cov[i][j] /= n - 1;
    }
  }
  return cov;
}

/**
 * Jacobi eigenvalue algorithm for a symmetric matrix.
 * Returns eigenvalues and eigenvectors sorted by eigenvalue DESCENDING.
 * vectors[k] = k-th eigenvector (length-d array), corresponding to values[k].
 */
export function jacobiEigen(
  sym: number[][],
  maxIter = 1000,
  tol = 1e-10,
): { values: number[]; vectors: number[][] } {
  const d = sym.length;
  // Copy A
  const A: number[][] = sym.map((row) => [...row]);
  // V = identity (columns will become eigenvectors)
  const V: number[][] = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_, j) => (i === j ? 1 : 0)),
  );

  for (let iter = 0; iter < maxIter; iter++) {
    // Find largest |off-diagonal| entry
    let maxVal = 0;
    let p = 0;
    let q = 1;
    for (let i = 0; i < d; i++) {
      for (let j = i + 1; j < d; j++) {
        const v = Math.abs(A[i][j]);
        if (v > maxVal) {
          maxVal = v;
          p = i;
          q = j;
        }
      }
    }
    if (maxVal < tol) break;

    // Compute Givens rotation
    const apq = A[p][q];
    const theta = (A[q][q] - A[p][p]) / (2 * apq);
    const sign = theta >= 0 ? 1 : -1;
    const t = sign / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
    const c = 1 / Math.sqrt(t * t + 1);
    const s = t * c;

    // Apply rotation to A (rows & columns p, q)
    // Update diagonal entries first
    const app = A[p][p];
    const aqq = A[q][q];
    const apq2 = A[p][q];
    A[p][p] = app - t * apq2;
    A[q][q] = aqq + t * apq2;
    A[p][q] = 0;
    A[q][p] = 0;

    // Update remaining rows/cols
    for (let r = 0; r < d; r++) {
      if (r === p || r === q) continue;
      const arp = A[r][p];
      const arq = A[r][q];
      A[r][p] = c * arp - s * arq;
      A[p][r] = A[r][p];
      A[r][q] = s * arp + c * arq;
      A[q][r] = A[r][q];
    }

    // Accumulate eigenvectors into V
    for (let i = 0; i < d; i++) {
      const vip = V[i][p];
      const viq = V[i][q];
      V[i][p] = c * vip - s * viq;
      V[i][q] = s * vip + c * viq;
    }
  }

  // Eigenvalues = diagonal of A; eigenvectors = columns of V
  const pairs: { value: number; vector: number[] }[] = Array.from({ length: d }, (_, k) => ({
    value: A[k][k],
    vector: Array.from({ length: d }, (_, i) => V[i][k]),
  }));

  // Sort descending by eigenvalue
  pairs.sort((a, b) => b.value - a.value);

  return {
    values: pairs.map((p) => p.value),
    vectors: pairs.map((p) => p.vector),
  };
}

export interface PCAResult {
  mean: number[];
  eigenvalues: number[];
  eigenvectors: number[][];
  explained: number[];
}

/** Full PCA: center data, compute covariance, Jacobi eigendecomposition. */
export function pca(data: number[][]): PCAResult {
  const mu = mean(data);
  const cov = covariance(data);
  const { values, vectors } = jacobiEigen(cov);
  const total = values.reduce((a, b) => a + b, 0);
  const explained = values.map((v) => (total > 0 ? v / total : 0));
  return { mean: mu, eigenvalues: values, eigenvectors: vectors, explained };
}

/**
 * Project rows onto two principal components.
 * Centers each row by mean, then dots with eigenvectors[xComp] and eigenvectors[yComp].
 */
export function project(
  data: number[][],
  result: PCAResult,
  xComp: number,
  yComp: number,
): [number, number][] {
  const { mean: mu, eigenvectors } = result;
  const ex = eigenvectors[xComp];
  const ey = eigenvectors[yComp];
  return data.map((row) => {
    const centered = row.map((v, j) => v - mu[j]);
    const px = centered.reduce((acc, v, j) => acc + v * ex[j], 0);
    const py = centered.reduce((acc, v, j) => acc + v * ey[j], 0);
    return [px, py];
  });
}
