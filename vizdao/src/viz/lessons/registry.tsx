// src/viz/lessons/registry.tsx — 单元 id → 组件映射。
// 未在此登记的单元在 UI 显示"课堂讲授"占位（优雅降级）。
import type { ComponentType } from 'react';
import { AnscombeLesson } from './AnscombeLesson';     // 开场
import { LessonView } from './LessonView';             // 过拟合（已上线）
import { DistributionLesson } from './DistributionLesson'; // 分布 KDE
import { HighdimLesson } from './HighdimLesson';       // 高维困境
import { ClusteringLesson } from './ClusteringLesson'; // 聚类 K-Means
import { DimReductionLesson } from './DimReductionLesson'; // 降维 PCA

export const LESSON_COMPONENTS: Record<string, ComponentType> = {
  anscombe: AnscombeLesson,
  overfitting: LessonView,
  distribution: DistributionLesson,
  highdim: HighdimLesson,
  clustering: ClusteringLesson,
  dimreduction: DimReductionLesson,
};
