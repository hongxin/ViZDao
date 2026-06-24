// src/viz/datasets/index.ts — 数据集注册表。加新行业数据集 = 写一个 Dataset 并在此登记。
import { bikeDataset } from './bikeSharing';
import { taxDataset } from './taxBurden';
import { telecomDataset } from './telecomChurn';
import { gridDataset } from './powerGrid';
import type { Dataset } from './types';

export type { Dataset, FieldKind } from './types';
export const DATASETS: Dataset[] = [bikeDataset, taxDataset, telecomDataset, gridDataset];
export const defaultDataset = bikeDataset;
export function datasetById(id: string): Dataset { return DATASETS.find((d) => d.id === id) ?? defaultDataset; }
