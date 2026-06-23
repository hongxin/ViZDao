// src/store/navStore.ts — 当前教学单元索引 + 导航。与各单元自身状态解耦。
import { create } from 'zustand';
import { LESSON_META } from '../viz/lessons/order';

const LAST = LESSON_META.length - 1;
const clamp = (i: number) => Math.max(0, Math.min(LAST, i));

interface NavState {
  index: number;
  goTo: (i: number) => void;
  next: () => void;
  prev: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  index: 0,
  goTo: (i) => set({ index: clamp(i) }),
  next: () => set((s) => ({ index: clamp(s.index + 1) })),
  prev: () => set((s) => ({ index: clamp(s.index - 1) })),
}));
