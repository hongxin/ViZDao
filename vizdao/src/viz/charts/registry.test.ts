import { describe, it, expect } from 'vitest';
import { buildLineScatterOption } from './registry';
import { genSinNoise } from '../datasets/sinNoise';
import { ridgeFit, normalize } from '../analysis/ridge';

interface SeriesItem { type: string; data?: unknown[] }

describe('buildLineScatterOption', () => {
  const data = genSinNoise(20, 0.3, 1);
  const w = ridgeFit(data.map((d) => normalize(d.x)), data.map((d) => d.y), 5, 0.001);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opt = buildLineScatterOption(data, w) as any;
  const series = opt.series as SeriesItem[];

  it('含三个 series：样本散点 + 拟合线 + 真值线', () => {
    expect(Array.isArray(series)).toBe(true);
    expect(series).toHaveLength(3);
    const types = series.map((s) => s.type).sort();
    expect(types).toEqual(['line', 'line', 'scatter']);
  });
  it('散点 series 的数据点数 = 样本数', () => {
    const scatter = series.find((s) => s.type === 'scatter');
    expect(scatter!.data).toHaveLength(20);
  });
});
