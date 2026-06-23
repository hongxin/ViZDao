// src/viz/lessons/registry.tsx — 单元 id → 组件映射。
// 未在此登记的单元在 UI 显示"课堂讲授"占位（优雅降级）。
import type { ComponentType } from 'react';
import { AnscombeUnit } from '../units/anscombe/anscombe.unit'; // 开场（体验引擎·新范式）
import { OverfittingUnit } from '../units/overfitting/overfitting.unit'; // 过拟合（体验引擎·新范式）
import { DistributionUnit } from '../units/distribution/distribution.unit'; // 分布（体验引擎·新范式）
import { HighdimUnit } from '../units/highdim/highdim.unit'; // 高维困境（体验引擎·新范式）
import { ClusteringUnit } from '../units/clustering/clustering.unit'; // 聚类（体验引擎·新范式）
import { DimReductionUnit } from '../units/dimreduction/dimreduction.unit'; // 降维（体验引擎·新范式）
import { ClosingUnit } from '../units/closing/closing.unit'; // 收束（体验引擎·新范式）

export const LESSON_COMPONENTS: Record<string, ComponentType> = {
  anscombe: AnscombeUnit,
  overfitting: OverfittingUnit,
  distribution: DistributionUnit,
  highdim: HighdimUnit,
  clustering: ClusteringUnit,
  dimreduction: DimReductionUnit,
  closing: ClosingUnit,
};
