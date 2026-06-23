import { describe, it, expect } from 'vitest';
import { OVERFITTING_LESSON, initialKnobValues, computeOverfitting, judgeOverfitCheckpoint } from './runner';
import { genSinNoise } from '../datasets/sinNoise';

describe('OVERFITTING_LESSON 数据完整', () => {
  it('含 degree/lambda/noise 三个 knob 与一个 checkpoint', () => {
    const ids = OVERFITTING_LESSON.knobs.map((k) => k.bindParam);
    expect(ids).toContain('degree');
    expect(ids).toContain('lambda');
    expect(OVERFITTING_LESSON.checkpoint).toBeTruthy();
  });
  it('initialKnobValues 取每个 knob 的 default', () => {
    const v = initialKnobValues(OVERFITTING_LESSON);
    expect(v.degree).toBe(3);
    expect(v.lambda).toBe(0);
  });
});

describe('computeOverfitting + checkpoint 判定', () => {
  const data = genSinNoise(20, 0.3, 2024);
  it('高阶 λ=0 → 检测到过拟合', () => {
    const over = computeOverfitting({ degree: 12, lambda: 0, noiseStd: 0.3 }, data);
    const j = judgeOverfitCheckpoint(null, over);
    expect(j.overfitSeen).toBe(true);
  });
  it('过拟合后加 λ 救回 → checkpoint 通过', () => {
    const over = computeOverfitting({ degree: 12, lambda: 0, noiseStd: 0.3 }, data);
    const rescued = computeOverfitting({ degree: 12, lambda: 0.1, noiseStd: 0.3 }, data);
    const j = judgeOverfitCheckpoint(over, rescued);
    expect(j.rescuedSeen).toBe(true);
    expect(j.passed).toBe(true);
  });
});
