// src/viz/analysis/kmeans.ts — 确定性 K-Means（Lloyd 迭代 + 随机初始化）。
// 用 makeRng(seed) 保证可复现，便于教学演示与测试。
import { makeRng } from '../datasets/sinNoise';

export interface KMeansResult {
  assignments: number[];
  centroids: number[][];
  iterations: number;
}

/** 欧氏距离平方（避免开方提升性能）。 */
function distSq(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
}

/**
 * K-Means 聚类（Lloyd 算法，随机种子初始化）。
 *
 * @param points  N×D 的点集
 * @param k       聚类数
 * @param opts    { seed?: number; maxIter?: number }
 * @returns       { assignments, centroids, iterations }
 */
export function kmeans(
  points: number[][],
  k: number,
  opts: { seed?: number; maxIter?: number } = {},
): KMeansResult {
  const { seed = 42, maxIter = 50 } = opts;
  const n = points.length;
  const dim = points[0].length;
  const rng = makeRng(seed);

  // --- 随机初始化：从 points 中不重复采样 k 个作为初始质心 ---
  // Fisher-Yates 部分洗牌，取前 k 个
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rng() * (n - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  let centroids: number[][] = indices.slice(0, k).map((idx) =>
    points[idx].slice(),
  );

  const assignments = new Array<number>(n).fill(0);
  let iterations = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1;

    // --- E-step：将每个点分配到最近质心 ---
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const d = distSq(points[i], centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        changed = true;
      }
    }

    // 已收敛 —— 在记录本次迭代后停止
    if (!changed && iter > 0) break;

    // --- M-step：重新计算质心 ---
    const sums: number[][] = Array.from({ length: k }, () =>
      new Array<number>(dim).fill(0),
    );
    const counts = new Array<number>(k).fill(0);
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let d = 0; d < dim; d++) sums[c][d] += points[i][d];
    }
    for (let c = 0; c < k; c++) {
      // 空簇保留上一轮质心，不做更新
      if (counts[c] === 0) continue;
      centroids[c] = sums[c].map((s) => s / counts[c]);
    }
  }

  return { assignments: Array.from(assignments), centroids, iterations };
}
