// src/viz/analysis/ridge.ts
// 移植自 hermes-work/code/prototypes/overfitting.html（已实跑验证）。
// 算法参照：_vizmodeling-reference/code/python/polynomial_fit.py (sklearn Ridge)。
// 关键：x 归一化到 [-1,1] 再做多项式特征，避免高阶范德蒙德矩阵病态。

export const XMIN = 0;
export const XMAX = 2 * Math.PI;

/** 归一化 x∈[XMIN,XMAX] → [-1,1]。 */
export function normalize(x: number): number {
  return ((x - XMIN) / (XMAX - XMIN)) * 2 - 1;
}

/** 高斯消元解 A w = b（partial pivoting）。 */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / piv;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12));
}

/** Ridge 多项式拟合：xn 为归一化坐标。A=XᵀX+λI（不正则截距列），b=Xᵀy。 */
export function ridgeFit(xn: number[], y: number[], degree: number, lambda: number): number[] {
  const n = xn.length;
  const p = degree + 1;
  const X = xn.map((x) => {
    const row: number[] = [];
    let v = 1;
    for (let j = 0; j < p; j++) { row.push(v); v *= x; }
    return row;
  });
  const A = Array.from({ length: p }, () => new Array(p).fill(0));
  const b = new Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < p; a++) {
      b[a] += X[i][a] * y[i];
      for (let c = 0; c < p; c++) A[a][c] += X[i][a] * X[i][c];
    }
  }
  for (let j = 1; j < p; j++) A[j][j] += lambda; // 截距不正则
  return solve(A, b);
}

/** 用系数 w 在归一化坐标 xn 上预测。 */
export function predict(w: number[], xn: number): number {
  let v = 1;
  let s = 0;
  for (let j = 0; j < w.length; j++) { s += w[j] * v; v *= xn; }
  return s;
}

/** 训练 MSE（对样本点）+ 真值 MSE（对 sin(x)）。 */
export function metrics(w: number[], data: { x: number; y: number }[]): { trainMSE: number; trueMSE: number } {
  const trainMSE = data.reduce((s, d) => s + (predict(w, normalize(d.x)) - d.y) ** 2, 0) / data.length;
  let trueMSE = 0;
  for (let i = 0; i <= 200; i++) {
    const x = XMIN + (i / 200) * (XMAX - XMIN);
    trueMSE += (predict(w, normalize(x)) - Math.sin(x)) ** 2;
  }
  trueMSE /= 201;
  return { trainMSE, trueMSE };
}

/** 曲线粗糙度：归一化域上采样 300 段的弧长（越大越摆动）。 */
export function roughness(w: number[]): number {
  let arc = 0;
  let prev: number | null = null;
  const steps = 300;
  for (let i = 0; i <= steps; i++) {
    const xn = -1 + (i / steps) * 2;
    const yv = predict(w, xn);
    if (prev !== null) arc += Math.hypot(2 / steps, yv - prev);
    prev = yv;
  }
  return arc;
}
