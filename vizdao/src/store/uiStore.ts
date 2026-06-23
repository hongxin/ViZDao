// src/store/uiStore.ts — 轻量 UI 标志。entered = 已进入课程工作台（无需配置 AI 即可上手）。
import { create } from 'zustand';

interface UiState {
  entered: boolean;
  enter: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  entered: false,
  enter: () => set({ entered: true }),
}));
