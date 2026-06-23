// src/viz/datasets/iris.ts — Iris 风格数据集（按真实 Iris 各类统计量确定性生成）。
// 4 维特征 + 3 类。花瓣两维(2,3)可分性远高于花萼两维(0,1)，用于"高维困境/聚类"教学。
import { makeRng, gaussian } from './sinNoise';

export type IrisSpecies = 'setosa' | 'versicolor' | 'virginica';
export interface IrisSample { features: [number, number, number, number]; species: IrisSpecies; }

/** 特征中文标签，下标 0..3。 */
export const IRIS_FEATURE_LABELS = ['花萼长', '花萼宽', '花瓣长', '花瓣宽'];
export const IRIS_SPECIES: IrisSpecies[] = ['setosa', 'versicolor', 'virginica'];
export const IRIS_SPECIES_LABEL: Record<IrisSpecies, string> = {
  setosa: '山鸢尾', versicolor: '变色鸢尾', virginica: '维吉尼亚鸢尾',
};

const CLASSES: { species: IrisSpecies; mean: number[]; std: number[] }[] = [
  { species: 'setosa', mean: [5.006, 3.428, 1.462, 0.246], std: [0.352, 0.379, 0.174, 0.105] },
  { species: 'versicolor', mean: [5.936, 2.770, 4.260, 1.326], std: [0.516, 0.314, 0.470, 0.198] },
  { species: 'virginica', mean: [6.588, 2.974, 5.552, 2.026], std: [0.636, 0.322, 0.552, 0.275] },
];

/** 每类 perClass 个，按各类均值/方差 + 高斯噪声确定性生成。 */
export function makeIris(perClass = 50, seed = 12345): IrisSample[] {
  const rng = makeRng(seed);
  const out: IrisSample[] = [];
  for (const c of CLASSES) {
    for (let i = 0; i < perClass; i++) {
      const f = c.mean.map((m, j) => Math.round((m + gaussian(rng) * c.std[j]) * 100) / 100) as [number, number, number, number];
      out.push({ features: f, species: c.species });
    }
  }
  return out;
}

export const IRIS: IrisSample[] = makeIris();
