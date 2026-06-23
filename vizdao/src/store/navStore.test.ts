import { describe, it, expect, beforeEach } from 'vitest';
import { useNavStore } from './navStore';
import { LESSON_META } from '../viz/lessons/order';

describe('navStore', () => {
  beforeEach(() => useNavStore.setState({ index: 0 }));

  it('初始在第 0 个单元', () => {
    expect(useNavStore.getState().index).toBe(0);
  });
  it('next/prev 在 [0, LAST] 内夹取', () => {
    const { next, prev } = useNavStore.getState();
    prev();
    expect(useNavStore.getState().index).toBe(0); // 不越下界
    for (let i = 0; i < LESSON_META.length + 3; i++) next();
    expect(useNavStore.getState().index).toBe(LESSON_META.length - 1); // 不越上界
  });
  it('goTo 跳到指定单元并夹取', () => {
    useNavStore.getState().goTo(2);
    expect(useNavStore.getState().index).toBe(2);
    useNavStore.getState().goTo(999);
    expect(useNavStore.getState().index).toBe(LESSON_META.length - 1);
  });
});
