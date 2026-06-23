import { describe, it, expect } from 'vitest';
import { TSNE } from './tsne';
import { makeRng, gaussian } from '../datasets/sinNoise';

// 三个在 4D 里分得很开的簇，每簇 12 个点。
function threeBlobs(): { X: number[][]; label: number[] } {
  const rng = makeRng(1);
  const centers = [[0, 0, 0, 0], [10, 10, 0, 0], [0, 0, 10, 10]];
  const X: number[][] = []; const label: number[] = [];
  centers.forEach((c, k) => {
    for (let i = 0; i < 12; i++) {
      X.push(c.map((v) => v + gaussian(rng) * 0.3));
      label.push(k);
    }
  });
  return { X, label };
}

function runSteps(seed: number, steps: number): number[][] {
  const { X } = threeBlobs();
  const t = new TSNE({ perplexity: 8, seed });
  t.initData(X);
  for (let i = 0; i < steps; i++) t.step();
  return t.getSolution();
}

describe('TSNE', () => {
  it('返回 N 个 2D 点', () => {
    const Y = runSteps(42, 5);
    expect(Y).toHaveLength(36);
    expect(Y[0]).toHaveLength(2);
  });

  it('同种子可复现', () => {
    expect(runSteps(7, 30)).toEqual(runSteps(7, 30));
  });

  it('把三个分离簇解成三团（簇内紧、簇间远）', () => {
    const { label } = threeBlobs();
    const Y = runSteps(42, 250);
    // 各簇质心
    const cent = [0, 1, 2].map((k) => {
      const pts = Y.filter((_, i) => label[i] === k);
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      return [cx, cy];
    });
    const intra = [0, 1, 2].map((k) => {
      const pts = Y.filter((_, i) => label[i] === k);
      return Math.max(...pts.map((p) => Math.hypot(p[0] - cent[k][0], p[1] - cent[k][1])));
    });
    const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const minInter = Math.min(dist(cent[0], cent[1]), dist(cent[0], cent[2]), dist(cent[1], cent[2]));
    const maxIntra = Math.max(...intra);
    // 簇间最近距离应明显大于簇内最大半径
    expect(minInter).toBeGreaterThan(maxIntra * 1.5);
  });
});
