import { describe, it, expect } from 'vitest';
import { umapEmbed } from './embed';
import { IRIS } from '../datasets/iris';

const features = IRIS.map((s) => s.features as number[]);

describe('umapEmbed', () => {
  it('返回 n 个 2D 点', () => {
    const out = umapEmbed(features, 15);
    expect(out).toHaveLength(features.length);
    expect(out[0]).toHaveLength(2);
  });
  it('同种子可复现', () => {
    expect(umapEmbed(features, 15, 7)).toEqual(umapEmbed(features, 15, 7));
  });
});
