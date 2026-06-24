// src/store/workbenchStore.ts — ViewBus：三条意图通道（语言 AI / 积木 / GUI）共享的「分析意图 IR」。
// views 是 ViewSpec[]（题眼 IR）；selection 是刷选记录下标集，驱动所有视图联动高亮。
// 可在 React 外用 useWorkbenchStore.getState().<action>() 直改（供 AI 分析工具调用）。
import { create } from 'zustand';
import type { Expr } from '../viz/analysis/expr';

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

export const MISSION = '找出 Bike-Sharing 里最反直觉的一条规律，用多视图为它辩护。';

/** 初始四视图：温度反转 / 时间序列 / 天气 / 用户类型分裂。 */
export const INITIAL_VIEWS: ViewSpec[] = [
  { id: 'v1', chart: 'scatter', x: 'temp', y: 'cnt', title: '气温 × 总租车量' },
  { id: 'v2', chart: 'line', x: 'dteday', y: 'cnt', title: '总租车量 · 时间序列' },
  { id: 'v3', chart: 'bar', by: 'weathersit', y: 'cnt', agg: 'mean', title: '平均租车量 · 按天气' },
  { id: 'v4', chart: 'scatter', x: 'registered', y: 'casual', color: 'workingday', title: '注册 × 临时（按是否工作日）' },
];

let seq = INITIAL_VIEWS.length;
export function nextViewId(): string { return `v${++seq}`; }

interface WorkbenchState {
  views: ViewSpec[];
  selection: number[] | null;   // 选中的 BIKE 记录下标；null = 未选
  mission: string;
  addView: (v: ViewSpec) => void;
  removeView: (id: string) => void;
  updateView: (id: string, patch: Partial<ViewSpec>) => void;
  setViews: (views: ViewSpec[]) => void;
  setSelection: (idx: number[] | null) => void;
  reset: () => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  views: INITIAL_VIEWS,
  selection: null,
  mission: MISSION,
  addView: (v) => set((s) => ({ views: [...s.views, v] })),
  removeView: (id) => set((s) => ({ views: s.views.filter((v) => v.id !== id) })),
  updateView: (id, patch) => set((s) => ({ views: s.views.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
  setViews: (views) => set({ views }),
  setSelection: (idx) => set({ selection: idx && idx.length ? idx : null }),
  reset: () => set({ views: INITIAL_VIEWS, selection: null }),
}));
