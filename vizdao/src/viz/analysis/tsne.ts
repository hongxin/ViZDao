// src/viz/analysis/tsne.ts — 纯 TS t-SNE（移植自 Karpathy tsnejs 算法，无第三方依赖）。
// 可播种、支持逐步 step() —— 用于"看着数据解团"的动画演示。
import { makeRng } from '../datasets/sinNoise';

/** 由均匀 rng 得到标准正态（Marsaglia polar）。 */
function makeGauss(rng: () => number): () => number {
  let cached = false;
  let cachedVal = 0;
  return () => {
    if (cached) { cached = false; return cachedVal; }
    let u = 0, v = 0, r = 0;
    do { u = 2 * rng() - 1; v = 2 * rng() - 1; r = u * u + v * v; } while (r === 0 || r > 1);
    const c = Math.sqrt((-2 * Math.log(r)) / r);
    cachedVal = v * c; cached = true;
    return u * c;
  };
}

/** N×N 欧氏距离平方（展平成长度 N*N 的数组）。 */
function pairwiseSqDist(X: number[][]): number[] {
  const N = X.length;
  const dist = new Array(N * N).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      let d = 0;
      const xi = X[i], xj = X[j];
      for (let k = 0; k < xi.length; k++) { const t = xi[k] - xj[k]; d += t * t; }
      dist[i * N + j] = d; dist[j * N + i] = d;
    }
  }
  return dist;
}

/** 由距离 + perplexity 二分搜索 beta，得到对称化的高维亲和 P。 */
function distToP(D: number[], N: number, perplexity: number, tol = 1e-4): number[] {
  const Htarget = Math.log(perplexity);
  const P = new Array(N * N).fill(0);
  const prow = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    let betamin = -Infinity, betamax = Infinity, beta = 1;
    let num = 0, done = false;
    while (!done) {
      let psum = 0;
      for (let j = 0; j < N; j++) {
        let pj = Math.exp(-D[i * N + j] * beta);
        if (i === j) pj = 0;
        prow[j] = pj; psum += pj;
      }
      let H = 0;
      for (let j = 0; j < N; j++) {
        const pj = psum === 0 ? 0 : prow[j] / psum;
        prow[j] = pj;
        if (pj > 1e-7) H -= pj * Math.log(pj);
      }
      if (H > Htarget) { betamin = beta; beta = betamax === Infinity ? beta * 2 : (beta + betamax) / 2; }
      else { betamax = beta; beta = betamin === -Infinity ? beta / 2 : (beta + betamin) / 2; }
      num++;
      if (Math.abs(H - Htarget) < tol || num >= 50) done = true;
    }
    for (let j = 0; j < N; j++) P[i * N + j] = prow[j];
  }
  const out = new Array(N * N).fill(0);
  const denom = 2 * N;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    out[i * N + j] = Math.max((P[i * N + j] + P[j * N + i]) / denom, 1e-100);
  }
  return out;
}

export class TSNE {
  readonly perplexity: number;
  readonly dim: number;
  readonly epsilon: number;
  private N = 0;
  private P: number[] = [];
  private Y: number[][] = [];
  private gains: number[][] = [];
  private ystep: number[][] = [];
  private iter = 0;
  private gauss: () => number;

  constructor(opt: { perplexity?: number; dim?: number; epsilon?: number; seed?: number } = {}) {
    this.perplexity = opt.perplexity ?? 30;
    this.dim = opt.dim ?? 2;
    this.epsilon = opt.epsilon ?? 10;
    this.gauss = makeGauss(makeRng(opt.seed ?? 42));
  }

  /** 载入原始高维数据并初始化。 */
  initData(X: number[][]): void {
    const N = X.length;
    this.N = N;
    this.P = distToP(pairwiseSqDist(X), N, this.perplexity);
    this.iter = 0;
    this.Y = []; this.gains = []; this.ystep = [];
    for (let i = 0; i < N; i++) {
      const y: number[] = [], g: number[] = [], s: number[] = [];
      for (let d = 0; d < this.dim; d++) { y.push(this.gauss() * 1e-4); g.push(1); s.push(0); }
      this.Y.push(y); this.gains.push(g); this.ystep.push(s);
    }
  }

  /** 走一步梯度下降，返回当前 cost（KL 近似，仅供监控）。 */
  step(): number {
    this.iter++;
    const N = this.N, dim = this.dim, P = this.P;
    const pmul = this.iter < 100 ? 4 : 1; // early exaggeration

    // 学生 t 分布的未归一化 Q
    const Qu = new Array(N * N).fill(0);
    let qsum = 0;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      let dsum = 0;
      for (let d = 0; d < dim; d++) { const t = this.Y[i][d] - this.Y[j][d]; dsum += t * t; }
      const qu = 1 / (1 + dsum);
      Qu[i * N + j] = qu; Qu[j * N + i] = qu; qsum += 2 * qu;
    }

    let cost = 0;
    const grad: number[][] = [];
    for (let i = 0; i < N; i++) {
      const gi = new Array(dim).fill(0);
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const q = Math.max(Qu[i * N + j] / qsum, 1e-100);
        const p = pmul * P[i * N + j];
        cost += -p * Math.log(q);
        const premult = 4 * (p - q) * Qu[i * N + j];
        for (let d = 0; d < dim; d++) gi[d] += premult * (this.Y[i][d] - this.Y[j][d]);
      }
      grad.push(gi);
    }

    // momentum + adaptive gains
    const momentum = this.iter < 250 ? 0.5 : 0.8;
    const ymean = new Array(dim).fill(0);
    for (let i = 0; i < N; i++) {
      for (let d = 0; d < dim; d++) {
        const gid = grad[i][d], sid = this.ystep[i][d];
        let gain = Math.sign(gid) === Math.sign(sid) ? this.gains[i][d] * 0.8 : this.gains[i][d] + 0.2;
        if (gain < 0.01) gain = 0.01;
        this.gains[i][d] = gain;
        const ns = momentum * sid - this.epsilon * gain * gid;
        this.ystep[i][d] = ns;
        this.Y[i][d] += ns;
        ymean[d] += this.Y[i][d];
      }
    }
    for (let i = 0; i < N; i++) for (let d = 0; d < dim; d++) this.Y[i][d] -= ymean[d] / N;

    return cost;
  }

  getSolution(): number[][] { return this.Y; }
  getIter(): number { return this.iter; }
}
