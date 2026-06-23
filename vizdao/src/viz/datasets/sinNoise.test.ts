import { describe, it, expect } from 'vitest';
import { makeRng, genSinNoise } from './sinNoise';
import { XMIN, XMAX } from '../analysis/ridge';

describe('makeRng（mulberry32）', () => {
  it('同种子 → 同序列（确定性）', () => {
    const a = makeRng(42); const b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('输出落在 [0,1)', () => {
    const r = makeRng(7);
    for (let i = 0; i < 100; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe('genSinNoise', () => {
  it('生成 n 个点，x 落在 [XMIN,XMAX]', () => {
    const pts = genSinNoise(30, 0.3, 1);
    expect(pts).toHaveLength(30);
    for (const p of pts) { expect(p.x).toBeGreaterThanOrEqual(XMIN); expect(p.x).toBeLessThanOrEqual(XMAX); }
  });
  it('同种子完全可复现', () => {
    expect(genSinNoise(10, 0.3, 99)).toEqual(genSinNoise(10, 0.3, 99));
  });
  it('sigma=0 时 y 严格等于 sin(x)', () => {
    const pts = genSinNoise(15, 0, 5);
    for (const p of pts) expect(p.y).toBeCloseTo(Math.sin(p.x), 9);
  });
});
