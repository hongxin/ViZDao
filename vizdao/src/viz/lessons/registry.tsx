// src/viz/lessons/registry.tsx — 单元 id → 组件映射。
// 未在此登记的单元在 UI 显示"课堂讲授"占位（优雅降级）。随单元建成逐个登记。
import type { ComponentType } from 'react';
import { LessonView } from './LessonView'; // 过拟合（已上线）

export const LESSON_COMPONENTS: Record<string, ComponentType> = {
  overfitting: LessonView,
};
