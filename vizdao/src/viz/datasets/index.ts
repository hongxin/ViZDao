// src/viz/datasets/index.ts — 数据集注册表。
import { bikeDataset } from './bikeSharing';
import { taxDataset } from './taxBurden';
import type { Dataset } from './types';

export type { Dataset, FieldKind } from './types';
export const DATASETS: Dataset[] = [bikeDataset, taxDataset];
export const defaultDataset = bikeDataset;
export function datasetById(id: string): Dataset { return DATASETS.find((d) => d.id === id) ?? defaultDataset; }
