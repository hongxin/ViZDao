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

/** 一个教学单元的最小描述。 */
export interface Lesson {
  id: string;
  title: string;
  /** 分步内容，待细化。 */
  steps?: unknown[];
}

export {}; // 保证作为模块被识别
