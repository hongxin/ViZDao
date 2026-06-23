// src/viz/datasets/sinNoise.ts
// 参照 _vizmodeling-reference polynomial_fit.py 的 gen_data：x∈[0,2π], y=sin(x)+N(0,σ)。
// 用确定性 PRNG（mulberry32）+ Box-Muller，保证测试可复现与"重采样"可控。
import { XMIN, XMAX } from '../analysis/ridge';

export interface Point { x: number; y: number; }

/** mulberry32：32 位确定性 PRNG，返回 [0,1)。 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller：由两个 (0,1) 均匀数生成标准正态。 */
export function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** y = sin(x) + N(0,σ)，x 均匀采样于 [XMIN,XMAX]。 */
export function genSinNoise(n: number, sigma: number, seed: number): Point[] {
  const rng = makeRng(seed);
  return Array.from({ length: n }, () => {
    const x = XMIN + rng() * (XMAX - XMIN);
    return { x, y: Math.sin(x) + gaussian(rng) * sigma };
  });
}
