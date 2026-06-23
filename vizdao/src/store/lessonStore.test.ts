import { describe, it, expect, beforeEach } from 'vitest';
import { useLessonStore } from './lessonStore';

describe('lessonStore', () => {
  beforeEach(() => useLessonStore.getState().resetForTest(99));

  it('初始 knob = lesson 默认值，且已算出 fit', () => {
    const s = useLessonStore.getState();
    expect(s.knobValues.degree).toBe(3);
    expect(s.fit).not.toBeNull();
  });

  it('setKnob 改 degree → 重算 fit', () => {
    useLessonStore.getState().setKnob('degree', 12);
    const s = useLessonStore.getState();
    expect(s.knobValues.degree).toBe(12);
    expect(s.fit!.trainMSE).toBeGreaterThan(0);
  });

  it('过拟合→加λ救回 → checkpointPassed 置真', () => {
    const api = useLessonStore.getState();
    api.setKnob('degree', 12);
    api.setKnob('lambda', 0);   // 过拟合态被记录到 lastOverfit
    api.setKnob('lambda', 0.1); // 救回
    expect(useLessonStore.getState().checkpointPassed).toBe(true);
  });

  it('toggleCollapse 翻转 leftCollapsed', () => {
    const before = useLessonStore.getState().leftCollapsed;
    useLessonStore.getState().toggleCollapse();
    expect(useLessonStore.getState().leftCollapsed).toBe(!before);
  });
});
