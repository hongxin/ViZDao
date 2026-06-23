import { describe, it, expect } from 'vitest';
import { buildLineScatterOption } from './registry';
import { genSinNoise } from '../datasets/sinNoise';
import { ridgeFit, normalize } from '../analysis/ridge';

describe('buildLineScatterOption', () => {
  const data = genSinNoise(20, 0.3, 1);
  const w = ridgeFit(data.map((d) => normalize(d.x)), data.map((d) => d.y), 5, 0.001);
  const opt = buildLineScatterOption(data, w) as any;

  it('含三个 series：样本散点 + 拟合线 + 真值线', () => {
    expect(Array.isArray(opt.series)).toBe(true);
    expect(opt.series).toHaveLength(3);
    const types = opt.series.map((s: any) => s.type).sort();
    expect(types).toEqual(['line', 'line', 'scatter']);
  });
  it('散点 series 的数据点数 = 样本数', () => {
    const scatter = opt.series.find((s: any) => s.type === 'scatter');
    expect(scatter.data).toHaveLength(20);
  });
});
