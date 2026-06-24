// src/store/workbenchStore.ts — ViewBus：三条意图通道（语言 AI / 积木 / GUI）共享的「分析意图 IR」。
// views 是 ViewSpec[]（题眼 IR）；selection 是刷选记录下标集，驱动所有视图联动高亮。
// 可在 React 外用 useWorkbenchStore.getState().<action>() 直改（供 AI 分析工具调用）。
import { create } from 'zustand';
import type { Expr } from '../viz/analysis/expr';
import { defaultDataset, datasetById, type Dataset } from '../viz/datasets';

export type ChartKind = 'scatter' | 'line' | 'bar' | 'hist';
export type Agg = 'mean' | 'sum' | 'count' | 'min' | 'max';

/** 分析意图 IR：一个视图的完整描述。三通道共用、store 持有、AI 工具产出、积木映射。
 *  Phase 1 起支持「派生新列」derive 与「表达式筛选」filter——x/y/color/by 可引用派生列名。 */
export interface ViewSpec {
  id: string;
  chart: ChartKind;
  x?: string;            // 列名编码（基础列或派生列名）
  y?: string;
  color?: string;        // 分类着色列
  agg?: Agg;             // 聚合（bar）
  by?: string;           // 分组列（bar）
  derive?: { name: string; expr: Expr }[];   // 派生新列：name = 表达式
  filter?: Expr;         // 行筛选条件（布尔表达式）
  sort?: { by: string; dir: 'asc' | 'desc'; topN?: number };   // 排序 / 取前 N
  title?: string;
}

/** 执行顺序：筛选 → 派生 → 分组(by+agg) → 排序/取前N → 画。by+agg 对所有图型生效（分组成任意图）。 */

let seq = 0;
export function nextViewId(): string { return `nx${++seq}`; }

interface WorkbenchState {
  dataset: Dataset;             // 当前数据集（可切换：共享单车 / 企业税负 …）
  views: ViewSpec[];
  selection: number[] | null;   // 选中的行下标（索引 dataset.rows）；null = 未选
  mission: string;
  addView: (v: ViewSpec) => void;
  removeView: (id: string) => void;
  updateView: (id: string, patch: Partial<ViewSpec>) => void;
  setViews: (views: ViewSpec[]) => void;
  setSelection: (idx: number[] | null) => void;
  setDataset: (id: string) => void;   // 切换数据集：重置视图为该数据集的初始视图、清选区
  reset: () => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  dataset: defaultDataset,
  views: defaultDataset.initialViews,
  selection: null,
  mission: defaultDataset.mission,
  addView: (v) => set((s) => ({ views: [...s.views, v] })),
  removeView: (id) => set((s) => ({ views: s.views.filter((v) => v.id !== id) })),
  updateView: (id, patch) => set((s) => ({ views: s.views.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
  setViews: (views) => set({ views }),
  setSelection: (idx) => set({ selection: idx && idx.length ? idx : null }),
  setDataset: (id) => { const d = datasetById(id); set({ dataset: d, views: d.initialViews, selection: null, mission: d.mission }); },
  reset: () => set((s) => ({ views: s.dataset.initialViews, selection: null })),
}));
