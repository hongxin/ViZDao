// src/viz/lessons/order.ts — 教学单元顺序（仅元数据，不含组件，便于轻量 import）。
// 三幕 7 单元，对应 docs/teaching/2026-06-24 教案。未建成的单元在 UI 显示"课堂讲授"占位。

export interface LessonMeta {
  id: string;
  title: string;
  act: 0 | 1 | 2 | 3 | 4;
}

export const LESSON_META: LessonMeta[] = [
  { id: 'anscombe', title: '开场 · 看见胜过计算', act: 0 },
  { id: 'overfitting', title: '过拟合 · 拟合→正则', act: 1 },
  { id: 'distribution', title: '分布 · 直方图→KDE', act: 1 },
  { id: 'highdim', title: '高维困境 · Iris', act: 2 },
  { id: 'clustering', title: '聚类 · K-Means', act: 2 },
  { id: 'dimreduction', title: '降维 · PCA/t-SNE', act: 2 },
  { id: 'closing', title: '收束 · 可视化×AI', act: 3 },
  { id: 'future', title: '未来 · 自由创作', act: 4 },
];

export const ACT_LABEL: Record<number, string> = {
  0: '开场',
  1: '一维',
  2: '多维',
  3: '收束',
  4: '未来',
};
