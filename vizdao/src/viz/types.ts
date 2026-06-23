// src/viz/types.ts — 可视化教学核心的共享类型（占位）
//
// 占位定义：在深入规划阶段会被重塑。先给出最小骨架，让其它占位模块可以 import。

/** 一个可视化实验的最小描述。 */
export interface VizExperiment {
  id: string;
  title: string;
  /** 图表类型 key，对应 charts/ 注册表。 */
  chartType: string;
  /** 关联数据集 id。 */
  datasetId?: string;
  /** 图表配置（ECharts option 或自定义 DSL，待定）。 */
  config?: unknown;
  createdAt: number;
  updatedAt: number;
}

/** 一个数据集的最小描述。 */
export interface Dataset {
  id: string;
  name: string;
  /** 列定义 / schema，待细化。 */
  schema?: unknown;
  /** 行数据，或指向 VirtualFS 的引用，待定。 */
  rows?: unknown[];
}

/** 旋钮：行的入口。把"看见模型"变成"亲手让模型动"。 */
export interface Knob {
  id: string;
  label: string;
  kind: 'slider' | 'toggle' | 'select' | 'button';
  /** 绑定到模型参数名，驱动重算。 */
  bindParam: string;
  default: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  /** slider 标度；λ 这类跨数量级参数必须 'log'。 */
  scale?: 'linear' | 'log';
  options?: { value: string; label: string }[];
  unit?: string;
  hint?: string;
}

/** 闯关：要求学员把模型调到某个可判定的状态。 */
export interface Checkpoint {
  id: string;
  prompt: string;
  verify: string;
}

/** 一个教学单元 = 讲(hook) + 做(knobs) + 悟(ahaMoment/takeaway)。 */
export interface Lesson {
  id: string;
  act: 0 | 1 | 2 | 3;
  title: string;
  hook: string;
  chartType: string;
  datasetId: string;
  knobs: Knob[];
  ahaMoment: string;
  takeaway: string;
  checkpoint?: Checkpoint;
  aiHints: string[];
  refSlides: string[];
  estMinutes: number;
}
