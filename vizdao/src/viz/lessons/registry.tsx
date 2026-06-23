// src/viz/lessons/registry.tsx — 单元 id → 组件映射。
// 未在此登记的单元在 UI 显示"课堂讲授"占位（优雅降级）。
import type { ComponentType } from 'react';
import { AnscombeUnit } from '../units/anscombe/anscombe.unit'; // 开场（体验引擎·新范式）
import { OverfittingUnit } from '../units/overfitting/overfitting.unit'; // 过拟合（体验引擎·新范式）
import { DistributionLesson } from './DistributionLesson'; // 分布 KDE
import { HighdimLesson } from './HighdimLesson';       // 高维困境
import { ClusteringLesson } from './ClusteringLesson'; // 聚类 K-Means
import { DimReductionLesson } from './DimReductionLesson'; // 降维 PCA
import { ClosingLesson } from './ClosingLesson';           // 收束·可视化×AI

export const LESSON_COMPONENTS: Record<string, ComponentType> = {
  anscombe: AnscombeUnit,
  overfitting: OverfittingUnit,
  distribution: DistributionLesson,
  highdim: HighdimLesson,
  clustering: ClusteringLesson,
  dimreduction: DimReductionLesson,
  closing: ClosingLesson,
};
