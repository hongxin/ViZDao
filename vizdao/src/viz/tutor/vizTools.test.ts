import { describe, it, expect, beforeEach } from 'vitest';
import { createReadVizState } from './vizTools';
import { useLessonStore } from '../../store/lessonStore';

describe('read_viz_state 工具', () => {
  beforeEach(() => useLessonStore.getState().resetForTest(11));
  it('返回当前 lesson id 与 knob 值与指标', async () => {
    useLessonStore.getState().setKnob('degree', 9);
    const tool = createReadVizState();
    const out = await tool.execute({});
    const parsed = JSON.parse(out);
    expect(parsed.lessonId).toBe('overfitting');
    expect(parsed.knobValues.degree).toBe(9);
    expect(typeof parsed.metrics.trainMSE).toBe('number');
  });
  it('permission 为 safe', () => {
    expect(createReadVizState().permission).toBe('safe');
  });
});
