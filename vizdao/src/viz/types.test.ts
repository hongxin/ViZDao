import { describe, it, expect } from 'vitest';
import type { Knob, Lesson } from './types';

describe('viz types', () => {
  it('Knob 可构造一个 slider', () => {
    const k: Knob = { id: 'degree', label: '阶数', kind: 'slider', bindParam: 'degree', default: 3, min: 1, max: 15, step: 1, scale: 'linear' };
    expect(k.bindParam).toBe('degree');
  });
  it('Lesson 必含 hook/knobs/takeaway 三段要素', () => {
    const l: Lesson = { id: 'x', act: 1, title: 't', hook: 'h', chartType: 'line+scatter', datasetId: 'sin-noise', knobs: [], ahaMoment: 'a', takeaway: 'tk', aiHints: [], refSlides: [], estMinutes: 25 };
    expect(l.hook && l.takeaway).toBeTruthy();
  });
});
